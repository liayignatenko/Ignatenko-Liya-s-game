class PipePuzzleGame {
    constructor() {
        this.gridSize = 5;
        this.tiles = [];
        this.originalTiles = [];
        this.moves = 0;
        this.moves1 = 0;
        this.isGameWon = false;
        // Определение типов блоков и их соединений
        // [верх, право, низ, лево] - true означает наличие соединения
        this.tileTypes = {
            'straight': { 
                symbols: ['║', '═'], 
                connections: [
                    [true, false, true, false],  // Вертикальный
                    [false, true, false, true]    // Горизонтальный
                ]
            },
            'corner': { 
                symbols: ['╚', '╔', '╗', '╝'], 
                connections: [
                    [true, true, false, false],   // ┗ (верх-право)
                    [false, true, true, false],   // ┏ (право-низ)
                    [false, false, true, true],   // ┓ (низ-лево)
                    [true, false, false, true]    // ┛ (лево-верх)
                ]
            },
            't-shape': { 
                symbols: ['╠', '╦', '╣', '╩'], 
                connections: [
                    [true, true, true, false],    // ┣ (верх-право-низ)
                    [false, true, true, true],    // ┳ (право-низ-лево)
                    [true, false, true, true],   // ┫ (низ-лево-верх)
                    [true, true, false, true]     // ┻ (лево-верх-право)
                ]
            },
            'cross': {
                symbols: ['╬'],
                connections : [
                    [true, true, true, true]
                ],
            }
        };
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.createNewGame();
        this.setupEventListeners();
    }

    cacheElements() {
        this.gridElement = document.getElementById('grid');
        this.movesElement = document.getElementById('moves');
        this.messageElement = document.getElementById('message');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.hintBtn = document.getElementById('hint-btn');
    }
    

    createNewGame() {
        this.generateRandomLayout();
        this.saveOriginalState();
        this.renderGrid();
        this.moves = 0;
        this.isGameWon = false;
        this.updateMoves();
        this.hideMessage();
    }

    generateRandomLayout() {
        this.tiles = [];
        const types = ['straight', 'corner', 't-shape'];
        
        for (let row = 0; row < this.gridSize; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                // Случайный тип и поворот
                const type = 'straight';
                const rotation = Math.floor(Math.random() * 
                    (type === 'straight' ? 2 : 4));
                
                this.tiles[row][col] = { 
                    type, 
                    rotation
                };
            }
        }
        this.ensureSolvable();
        
    }

    ensureSolvable() {
        // Создаем простой путь для гарантии решаемости
        if (this.tiles[0][0].type !== 'corner') {
            this.tiles[0][0].type = 'corner';
        }
        if (this.tiles[4][0].type !== 'corner') {
            this.tiles[4][0].type = 'corner';
        }
        if (this.tiles[0][4].type !== 'corner') {
            this.tiles[0][4].type = 'corner';
        }
        if (this.tiles[4][4].type !== 'corner') {
            this.tiles[4][4].type = 'corner';
        } 
    }

    saveOriginalState() {
        this.originalTiles = JSON.parse(JSON.stringify(this.tiles));
    }

    renderGrid() {
        this.gridElement.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const tile = this.createTileElement(row, col);
                this.gridElement.appendChild(tile);
            }
        }
        
        this.highlightConnections();
    }

    createTileElement(row, col) {
        const tileData = this.tiles[row][col];
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.dataset.type = tileData.type;
        tile.dataset.rotation = tileData.rotation;
        
        // Устанавливаем символ
        const typeInfo = this.tileTypes[tileData.type];
        tile.textContent = typeInfo.symbols[tileData.rotation % typeInfo.symbols.length];
        
        return tile;
    }

    rotateTile(row, col) {
        if (this.isGameWon) return;
        
        const tile = this.tiles[row][col];
        const typeInfo = this.tileTypes[tile.type];
        
        // Поворачиваем (циклически)
        tile.rotation = (tile.rotation + 1) % typeInfo.symbols.length;
        
        // Обновляем отображение
        const tileElement = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
        tileElement.textContent = typeInfo.symbols[tile.rotation];
        tileElement.dataset.rotation = tile.rotation;
        
        this.moves++;
        this.updateMoves();
        this.highlightConnections();
        this.checkWinCondition();
        
        // Анимация поворота
        tileElement.style.transform = 'rotate(15deg) scale(1.1)';
        setTimeout(() => {
            tileElement.style.transform = '';
        }, 200);
    }

    highlightConnections() {
        // Сначала убираем все подсветки
        document.querySelectorAll('.tile').forEach(tile => {
            tile.classList.remove('connected');
        });
        
        // Находим все связанные блоки через BFS
        const visited = new Set();
        const queue = [[0, 0]]; // Начинаем с левого верхнего угла
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            const key = `${row},${col}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            const tileElement = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
            tileElement.classList.add('connected');
            
            // Проверяем всех соседей
            const neighbors = [
                {row: row-1, col: col, dirFrom: 0, dirTo: 2}, // Верх
                {row: row, col: col+1, dirFrom: 1, dirTo: 3}, // Право
                {row: row+1, col: col, dirFrom: 2, dirTo: 0}, // Низ
                {row: row, col: col-1, dirFrom: 3, dirTo: 1}  // Лево
            ];
            
            const tileData = this.tiles[row][col];
            const connections = this.tileTypes[tileData.type].connections[tileData.rotation];
            
            for (const neighbor of neighbors) {
                if (neighbor.row >= 0 && neighbor.row < this.gridSize && 
                    neighbor.col >= 0 && neighbor.col < this.gridSize) {
                    
                    const neighborData = this.tiles[neighbor.row][neighbor.col];
                    const neighborConnections = this.tileTypes[neighborData.type].connections[neighborData.rotation];
                    
                    // Если есть соединение в обе стороны
                    if (connections[neighbor.dirFrom] && neighborConnections[neighbor.dirTo]) {
                        queue.push([neighbor.row, neighbor.col]);
                    }
                }
            }
        }
    }

    checkWinCondition() {
        const connectedTiles = document.querySelectorAll('.tile.connected').length;
        
        if (connectedTiles === this.gridSize * this.gridSize) {
            this.winGame();
        }
    }

    winGame() {
        this.isGameWon = true;
        
        this.messageElement.textContent = `ПОБЕДА! Вы решили головоломку за ${this.moves} ходов!`;
        this.messageElement.className = 'message success';
        
        // Праздничная анимация
        this.celebrate();
    }

    celebrate() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.style.animation = 'celebrate 0.5s ease';
                setTimeout(() => {
                    tile.style.animation = '';
                }, 500);
            }, index * 30);
        });
    }

    shuffle() {
        if (this.isGameWon) return;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const tile = this.tiles[row][col];
                const typeInfo = this.tileTypes[tile.type];
                tile.rotation = Math.floor(Math.random() * typeInfo.symbols.length);
            }
        }
        
        this.moves++;
        this.updateMoves();
        this.renderGrid();
        this.hideMessage();
    }

    updateMoves() {
        this.movesElement.textContent = this.moves;
    }

    hideMessage() {
        this.messageElement.className = 'message';
    }

    setupEventListeners() {
        // Клик по тайлу
        this.gridElement.addEventListener('click', (e) => {
            const tile = e.target.closest('.tile');
            if (tile) {
                const row = parseInt(tile.dataset.row);
                const col = parseInt(tile.dataset.col);
                this.rotateTile(row, col);
            }
        });
        
        // Кнопки управления
        this.newGameBtn.addEventListener('click', () => {
            this.createNewGame();
        });
        
        this.shuffleBtn.addEventListener('click', () => {
            this.shuffle();
        });
        
        // Клавиатурные сокращения
        document.addEventListener('keydown', (e) => {
            if (e.key === 'n' || e.key === 'т') {
                this.createNewGame();
            } else if (e.key === 's' || e.key === 'ы') {
                this.shuffle();
            }
        });
    }
}

// Добавляем CSS-анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes celebrate {
        0% { transform: scale(1); }
        50% { transform: scale(1.2) rotate(10deg); background: gold; }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Инициализация игры
window.addEventListener('DOMContentLoaded', () => {
    new PipePuzzleGame();
});

