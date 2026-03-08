from enum import Enum

class Games(Enum):
    TICTACTOE = "tictactoe"
    ROCKPAPERSCISSORS = "rockpapsci"

class GameStates(Enum):
    Agent1 = 'agent1'
    Agent2 = 'agent2'
    Draw = 'draw'

class GameConfig:
    def __init__(self, actions, description, return_format):
        self.actions = actions
        self.description = description
        self.return_format = return_format

class Game:
    def __init__(self, agent_1, agent_2, name: str, config: GameConfig):
        self.agent_1 = agent_1
        self.agent_2 = agent_2
        self.round = 1
        self.name = name
        self.config = config
        self.running = True
        self.current_agent = agent_1  # Start with Agent 1
        self.messages = []
        self.resources = 10000
        self.winner = None

    def get_prompt(self, role=None) -> str:
        raise NotImplementedError("Each Game subclass must implement 'get_prompt()'")
