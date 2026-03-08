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
5. If you cant predict, choose a random move.
""",
            description="""
Two AI agents play Rock Paper Scissors. Think strategically to predict your opponent's move and choose the move that beats it.
""",
            return_format="""
Do not wrap the return format in backticks or anything else. Keep the data in pure JSON form.
{
    "analysis": "Predict what your opponent might play and decide what you should play to beat them.",
    "reason": "Explain why you are choosing this move.",
    "move": "rock, paper, or scissors"
}
"""
        )
        super().__init__(agent_1, agent_2, Games.ROCKPAPERSCISSORS.value, config)
        self.agent_1 = agent_1
        self.agent_2 = agent_2
        self.moves = {agent_1: None, agent_2: None}
        self.last_move = None
        self.marks = {agent_1: 'Player 1', agent_2: 'Player 2'}

    # Display status
    def board_to_string(self):
        m1 = self.moves[self.agent_1]
        m2 = self.moves[self.agent_2]
        
        status = []
        if m1:
            status.append(f"{self.marks[self.agent_1]} has made a move.")
        else:
            status.append(f"{self.marks[self.agent_1]} is waiting to move.")
            
        if m2:
            status.append(f"{self.marks[self.agent_2]} has made a move.")
        else:
            status.append(f"{self.marks[self.agent_2]} is waiting to move.")
            
        # If the game is over, reveal the moves
        if m1 is not None and m2 is not None:
            status.append(f"Result: {self.marks[self.agent_1]} played {m1}, {self.marks[self.agent_2]} played {m2}.")
            
        return "\n".join(status)

    def get_state(self):
        return self.board_to_string()

    def get_prompt(self) -> str:
        opponent = self.agent_2 if self.current_agent == self.agent_1 else self.agent_1

        return f"""
You are playing {self.name} as '{self.marks[self.current_agent]}'.
Opponent is '{self.marks[opponent]}'.

Game description:
{self.config.description}

Rules:
{self.config.actions}

Round: {self.round}

Current game state:
{self.get_state()}

Available moves: 'rock', 'paper', 'scissors'.
You MUST choose one of these available moves.

Return ONLY JSON in this format:
{self.config.return_format}
"""

    # Update move
    def update(self, state):
        if "move" not in state:
            raise Exception("Invalid JSON format. Expected key 'move'.")
            
        move = str(state["move"]).lower().strip()
        if move not in ["rock", "paper", "scissors"]:
            raise Exception("Invalid move. Must be 'rock', 'paper', or 'scissors'.")

        self.moves[self.current_agent] = move
        self.last_move = move

    # Check for draw
    def check_draw(self):
        m1 = self.moves[self.agent_1]
        m2 = self.moves[self.agent_2]
        return m1 is not None and m2 is not None and m1 == m2

    # Check for winner
    def check_win(self):
        m1 = self.moves[self.agent_1]
        m2 = self.moves[self.agent_2]
        
        # Game not finished if either hasn't moved yet
        if m1 is None or m2 is None:
            return None
            
        if m1 == m2:
            return GameStates.Draw
            
        if (m1 == "rock" and m2 == "scissors") or \
           (m1 == "scissors" and m2 == "paper") or \
           (m1 == "paper" and m2 == "rock"):
            return GameStates.Agent1
        else:
            return GameStates.Agent2