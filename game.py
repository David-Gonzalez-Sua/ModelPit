from enum import Enum
import connections as model_api
import json

class Model(Enum):
    GPT = "gpt"
    CLAUDE = "claude"
    GEMINI = "gemini"
    DEEPSEEK = "deepseek"
    KIMI = "kimi"
    OLLAMA = "ollama"

class Games(Enum):
    TICTACTOE = "tictactoe"

class GameStates(Enum):
    Agent1 = 'agent1'
    Agent2 = 'agent2'
    Draw = 'draw'

class GameConfig:
    def __init__(self, actions, description, return_format):
        self.actions = actions
        self.description = description
        self.return_format = return_format

class Agent:
    def __init__(self, model: Model, model_name: str = None):
        self.model = model
        self.model_name = model_name
        self.memory = []

    def prompt(self, system_prompt: str):
        result = ""

        user_message = 'Choose your move.'
        match self.model:
            case Model.GPT:
                result = model_api.call_gpt(system_prompt=system_prompt, user_message=user_message)
            case Model.CLAUDE:
                result = model_api.call_claude(system_prompt=system_prompt, user_message=user_message)
            case Model.GEMINI:
                result = model_api.call_gemini(system_prompt=system_prompt, user_message=user_message)
            case Model.DEEPSEEK:
                result = model_api.call_deepseek(system_prompt=system_prompt, user_message=user_message)
            case Model.KIMI:
                result = model_api.call_kimi(system_prompt=system_prompt, user_message=user_message)
            case Model.OLLAMA:
                if self.model_name:
                    result = model_api.call_ollama(system_prompt=system_prompt, user_message=user_message, model=self.model_name)
                else:
                    result = model_api.call_ollama(system_prompt=system_prompt, user_message=user_message)
            case _:
                raise Exception(f"Model {self.model} not supported.")
        
        return json.loads(result)


class Game:
    def __init__(self, agent_1: Agent, agent_2: Agent, name: str, config: GameConfig):
        self.agent_1 = agent_1
        self.agent_2 = agent_2
        self.round = 1
        self.name = name
        self.config = config
        self.running = True

class TicTacToe(Game):

    def __init__(self, agent_1: Agent, agent_2: Agent):

        config = GameConfig(
            actions="Choose a row and column (0-2) to place your mark.",
            description="Two agents play Tic Tac Toe. Try to get three in a row.",
            return_format="""
                {
                "row": 0-2,
                "col": 0-2,
                "reason": "short explanation"
                }
                """
        )

        super().__init__(agent_1, agent_2, Games.TICTACTOE.value, config)

        self.board = [["-" for _ in range(3)] for _ in range(3)]
        self.last_move = None

    def board_to_string(self):
        board = f"""
            {self.board[0][0]}{self.board[0][1]}{self.board[0][2]}
            {self.board[1][0]}{self.board[1][1]}{self.board[1][2]}
            {self.board[2][0]}{self.board[2][1]}{self.board[2][2]}
        """
        return board
    
    def get_state(self):
        return self.board_to_string()
    
    def update(self, state):

        row = state["row"]
        col = state["col"]

        if self.board[row][col] != "-":
            raise Exception("Invalid move: space already taken")
        if self.last_move is None:
            mark = "X"
        else:
            mark = "O" if self.last_move == "X" else "X"

        self.board[row][col] = mark
        self.last_move = mark

    def check_draw(self):
        for row in self.board:
            if "-" in row:
                return False
        return True
    
    def check_win(self):

        b = self.board

        # rows
        for row in b:
            if row[0] != "-" and row[0] == row[1] == row[2]:
                return GameStates.Agent1 if row[0] == "X" else GameStates.Agent2

        # columns
        for col in range(3):
            if b[0][col] != "-" and b[0][col] == b[1][col] == b[2][col]:
                return GameStates.Agent1 if b[0][col] == "X" else GameStates.Agent2

        # diagonals
        if b[0][0] != "-" and b[0][0] == b[1][1] == b[2][2]:
            return GameStates.Agent1 if b[0][0] == "X" else GameStates.Agent2

        if b[0][2] != "-" and b[0][2] == b[1][1] == b[2][0]:
            return GameStates.Agent1 if b[0][2] == "X" else GameStates.Agent2

        if self.check_draw():
            return GameStates.Draw

        return None




def create_prompt(game: TicTacToe):

    return f"""
        You are an AI agent playing {game.name}.

        Game description:
        {game.config.description}

        Rules:
        {game.config.actions}

        Round: {game.round}

        Game State:
        {game.get_state()}

        Return format:
        {game.config.return_format}
        Do not wrap the return data in backticks or anything else. Keep it raw data.
        """



agent_1 = Agent(Model.OLLAMA, model_name="rnj-1:8b")
agent_2 = Agent(Model.OLLAMA, model_name="rnj-1:8b")
game = TicTacToe(agent_1, agent_2)

while game.running:
    system_prompt = create_prompt(game)
    result = agent_1.prompt(system_prompt)
    print(result, game.get_state())
    game.update(result)
    progress = game.check_win()
    if progress:
        game.running = False


