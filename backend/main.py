from enum import Enum
import api_py as model_api
import json
import time
from games.game import GameStates, GameConfig, Game, Games
from games.tictactoe import TicTacToe
from games.rockpapsci import RockPaperScissors

# ==============================
# Models & Game States
# ==============================
class Model(Enum):
    GPT = "gpt"
    CLAUDE = "claude"
    GEMINI = "gemini"
    DEEPSEEK = "deepseek"
    KIMI = "kimi"
    OLLAMA = "ollama"

# ==============================
# Agent
# ==============================
class Agent:
    def __init__(self, model: Model):
        self.model = model
        self.memory = []

    def prompt(self, system_prompt: str):
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
                result = model_api.call_ollama(system_prompt=system_prompt, user_message=user_message)
            case _:
                raise Exception(f"Model {self.model} not supported.")

        # Parse JSON safely
        try:
            return json.loads(result)
        except Exception:
            raise Exception(f"Invalid JSON from model: {result}")




# ==============================
# Game Loop
# ==============================
agent_1 = Agent(Model.GPT)
agent_2 = Agent(Model.GPT)
# You can swap this to TicTacToe(agent_1, agent_2) or RockPaperScissors(agent_1, agent_2)
game = TicTacToe(agent_1, agent_2)

while game.running:
    system_prompt = game.get_prompt()
    
    while True:
        try:
            result = game.current_agent.prompt(system_prompt)
            game.update(result)
            break
        except Exception as e:
            # Send error back to AI for self-correction
            error_prompt = f"Your previous move was invalid: {e}\nPlease choose a valid move."
            
            system_prompt += "\n" + error_prompt
            print(f"Agent failed, retrying... Error: {e}")

    print(f"\nRound {game.round} - {game.marks[game.current_agent]}'s move:")
    print(game.get_state())
    game.round += 1

    # Check win/draw
    status = game.check_win()
    if status:
        print(f"\nFinal State:")
        print(game.get_state())
        match status:
            case GameStates.Agent1:
                print(f"\n{game.marks[game.agent_1]} wins!")
            case GameStates.Agent2:
                print(f"\n{game.marks[game.agent_2]} wins!")
            case GameStates.Draw:
                print("\nGame is a draw!")
        game.running = False
        break

    # Switch turns
    game.current_agent = game.agent_1 if game.current_agent == game.agent_2 else game.agent_2