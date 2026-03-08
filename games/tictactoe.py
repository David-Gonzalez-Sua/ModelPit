from .game import GameConfig, GameStates, Games, Game

class TicTacToe(Game):
    def __init__(self, agent_1, agent_2):
        config = GameConfig(
            actions="""
Rules for Tic Tac Toe:
1. The board is a 3x3 grid with rows and columns numbered 0-2.
2. Players take turns placing their mark ('X' or 'O') in an empty cell.
3. You must choose an empty cell. Picking an occupied cell is invalid.
4. The first to get 3 in a row (horizontally, vertically, or diagonally) wins.
5. If all cells are filled with no winner, the game is a draw.
6. Always return valid JSON only, no extra formatting.
7. Try and win in the last moves possible.
""",
            description="""
Two AI agents play Tic Tac Toe. Choose moves strategically to win or block your opponent.
""",
            return_format="""
Do not wrap the return format in backticks or anything else. Keep the data in pure JSON form.
{
    "analysis": "Identify your marks, your opponent's marks. List any immediate winning moves you have. If none, list any immediate winning moves your opponent has to block them.",
    "reason": "Explain why you are choosing this cell. Focus on forcing a win or blocking the opponent.",
    "row": 0-2,
    "col": 0-2
}
"""
        )
        super().__init__(agent_1, agent_2, Games.TICTACTOE.value, config)
        self.agent_1 = agent_1
        self.agent_2 = agent_2
        self.board = [["-" for _ in range(3)] for _ in range(3)]
        self.last_move = None
        self.marks = {agent_1:'X', agent_2:'O'}

    # Display labeled board
    def board_to_string(self):
        board_lines = ["  0 1 2"]
        for idx, row in enumerate(self.board):
            board_lines.append(f"{idx} " + " ".join(cell for cell in row))
        return "\n".join(board_lines)

    def get_state(self):
        return self.board_to_string()

    def get_prompt(self) -> str:
        available_moves = []
        for r in range(3):
            for c in range(3):
                if self.board[r][c] == "-":
                    available_moves.append(f"({r}, {c})")
        available_str = ", ".join(available_moves)

        opponent = self.agent_2 if self.current_agent == self.agent_1 else self.agent_1

        return f"""
You are playing {self.name} as '{self.marks[self.current_agent]}'.
Opponent is '{self.marks[opponent]}'.

Game description:
{self.config.description}

Rules:
{self.config.actions}

Round: {self.round}

Current board:
{self.get_state()}

Available empty cells (row, col): {available_str}
You MUST choose one of these available empty cells.

Return ONLY JSON in this format:
{self.config.return_format}
"""

    # Update move
    def update(self, state):
        row = state["row"]
        col = state["col"]

        if not (0 <= row <= 2 and 0 <= col <= 2):
            raise Exception("Move out of bounds.")
        if self.board[row][col] != "-":
            raise Exception("Invalid move: space already taken.")

        mark = self.marks[self.current_agent]
        self.board[row][col] = mark
        self.last_move = mark

    # Check for draw
    def check_draw(self):
        return all(cell != "-" for row in self.board for cell in row)

    # Check for winner
    def check_win(self):
        b = self.board
        lines = [
            # Rows
            [b[0][0], b[0][1], b[0][2]],
            [b[1][0], b[1][1], b[1][2]],
            [b[2][0], b[2][1], b[2][2]],
            # Columns
            [b[0][0], b[1][0], b[2][0]],
            [b[0][1], b[1][1], b[2][1]],
            [b[0][2], b[1][2], b[2][2]],
            # Diagonals
            [b[0][0], b[1][1], b[2][2]],
            [b[0][2], b[1][1], b[2][0]],
        ]
        for line in lines:
            if line[0] != "-" and line[0] == line[1] == line[2]:
                return GameStates.Agent1 if line[0] == self.marks[self.agent_1] else GameStates.Agent2
        if self.check_draw():
            return GameStates.Draw
        return None
