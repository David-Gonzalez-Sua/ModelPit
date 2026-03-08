from .game import GameConfig, GameStates, Games, Game

class RockPaperScissors(Game):
    def __init__(self, agent_1, agent_2):
        config = GameConfig(
            actions="""
Rules for Rock Paper Scissors:
1. You must choose 'rock', 'paper', or 'scissors'.
2. Rock beats scissors, scissors beats paper, and paper beats rock.
3. If both players choose the same move, the game is a draw.
4. Always return valid JSON only, no extra formatting.
""",
            description="""
Two AI agents play Rock Paper Scissors. Think strategically to predict your opponent's move.
""",
            return_format="""
{
    "analysis": "Predict what your opponent might play.",
    "reason": "Explain why you are choosing this move.",
    "move": "rock, paper, or scissors"
}
"""
        )
        super().__init__(agent_1, agent_2, Games.ROCKPAPERSCISSORS.value, config)
        self.moves = {agent_1: None, agent_2: None}
        self.marks = {agent_1: 'Player 1', agent_2: 'Player 2'}

    def board_to_string(self):
        m1 = self.moves[self.agent_1]
        m2 = self.moves[self.agent_2]
        status = []
        status.append(f"Player 1: {'Moved' if m1 else 'Waiting'}")
        status.append(f"Player 2: {'Moved' if m2 else 'Waiting'}")
        if m1 and m2:
            status.append(f"Result: {m1} vs {m2}")
        return "\n".join(status)

    def get_state(self):
        return self.board_to_string()

    def get_prompt(self, role=None) -> str:
        opponent = self.agent_2 if self.current_agent == self.agent_1 else self.agent_1
        return f"""
You are playing {self.name} as '{self.marks[self.current_agent]}'.
Opponent is '{self.marks[opponent]}'.
Game description: {self.config.description}
Rules: {self.config.actions}
Return ONLY JSON: {self.config.return_format}
"""

    def update(self, role, state):
        move = str(state.get("move", "")).lower().strip()
        if move not in ["rock", "paper", "scissors"]:
            raise Exception("Invalid move. Must be 'rock', 'paper', or 'scissors'.")

        self.moves[self.current_agent] = move
        self.messages.append({
            "role": self.marks[self.current_agent],
            "text": f"Chose {move}.",
            "analysis": state.get("analysis", ""),
            "reason": state.get("reason", "")
        })
        
        # Check if both moved
        if self.moves[self.agent_1] and self.moves[self.agent_2]:
            status = self.check_win()
            self.running = False
            if status == GameStates.Agent1: self.winner = "agent1"
            elif status == GameStates.Agent2: self.winner = "agent2"
            else: self.winner = "draw"

    def check_win(self):
        m1 = self.moves[self.agent_1]
        m2 = self.moves[self.agent_2]
        if not m1 or not m2: return None
        if m1 == m2: return GameStates.Draw
        if (m1 == "rock" and m2 == "scissors") or \
           (m1 == "scissors" and m2 == "paper") or \
           (m1 == "paper" and m2 == "rock"):
            return GameStates.Agent1
        return GameStates.Agent2
