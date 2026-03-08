from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os

from models import Model, Agent
from games.word_guessing import WordGuessing
from games.tictactoe import TicTacToe
from games.rockpapsci import RockPaperScissors
import api_py as model_api

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for active battles
battles = {}

class StartBattleRequest(BaseModel):
    attacker: str
    defender: str
    attackerSubModel: Optional[str] = None
    defenderSubModel: Optional[str] = None
    playMode: str
    gameMode: str
    targetWord: Optional[str] = "OBLIVION"

@app.get("/api/ollama/models")
def get_ollama_models():
    return {"models": model_api.list_ollama_models()}

@app.get("/api/gemini/models")
def get_gemini_models():
    return {"models": model_api.get_gemini_models()}

@app.post("/api/battle/start")
def start_battle(req: StartBattleRequest):
    # Check if any battle is currently running
    for b_id, b_data in battles.items():
        if b_data["game"].running:
            raise HTTPException(status_code=400, detail="A match is already running. Please wait for it to finish or stop it.")
    
    # Reset context: Clear all previous battles/history
    battles.clear()
    
    battle_id = str(uuid.uuid4())
    
    atk_model_type = Model(req.attacker.lower()) if req.attacker.lower() != "human" else Model.HUMAN
    def_model_type = Model(req.defender.lower())
    
    agent_1 = Agent(atk_model_type, sub_model=req.attackerSubModel)
    agent_2 = Agent(def_model_type, sub_model=req.defenderSubModel)
    
    if req.gameMode == "word_guessing":
        game = WordGuessing(agent_1, agent_2, secret_word=req.targetWord)
    elif req.gameMode == "tictactoe":
        game = TicTacToe(agent_1, agent_2)
    elif req.gameMode == "rockpapsci":
        game = RockPaperScissors(agent_1, agent_2)
    else:
        game = WordGuessing(agent_1, agent_2, secret_word=req.targetWord)
        
    battles[battle_id] = {
        "game": game,
        "atk_model": req.attacker,
        "def_model": req.defender,
        "mode": req.playMode,
        "gameMode": req.gameMode
    }
    
    return {"battleId": battle_id, "secretWord": getattr(game, 'secret_word', None)}

@app.post("/api/battle/turn")
def take_turn(battle_id: str):
    if battle_id not in battles:
        raise HTTPException(status_code=404, detail="Battle not found")
        
    battle = battles[battle_id]
    game = battle["game"]
    
    if not game.running:
        return {
            "messages": game.messages,
            "resources": game.resources,
            "finished": True, 
            "winner": game.winner,
            "state": game.get_state()
        }

    try:
        start_msg_count = len(game.messages)
        if battle["gameMode"] == "word_guessing":
            # 1. Attacker Turn
            atk_prompt = game.get_prompt(role="attacker")
            atk_res, atk_resources = game.agent_1.prompt(atk_prompt)
            game.resources -= atk_resources
            if "error" in atk_res:
                 raise Exception(f"Attacker Error: {atk_res['error']}")
            game.update("attacker", atk_res)
            
            if game.running:
                # 2. Defender Turn
                def_prompt = game.get_prompt(role="defender")
                def_res, def_resources = game.agent_2.prompt(def_prompt)
                if "error" in def_res:
                    raise Exception(f"Defender Error: {def_res['error']}")
                game.update("defender", def_res)
        else:
            # Turn-based or simultaneous (played as turns here)
            prompt = game.get_prompt()
            res = game.current_agent.prompt(prompt)
            if "error" in res:
                raise Exception(f"Agent Error: {res['error']}")
            game.update(None, res)
            # Switch agent
            game.current_agent = game.agent_1 if game.current_agent == game.agent_2 else game.agent_2
            game.round += 1
            
        # Terminal Logging
        new_messages = game.messages[start_msg_count:]
        print(f"\n--- BATTLE: {battle_id[:8]} | ROUND: {game.round} ---")
        for msg in new_messages:
            role = msg.get('role', 'Unknown')
            text = msg.get('text', '')
            print(f"[{role}]: {text}")
        
        print(f"CURRENT STATE:\n{game.get_state()}")
        
        if not game.running:
            print(f"*** BATTLE FINISHED! WINNER: {game.winner} ***")
            
    except Exception as e:
        print(f"Error during turn: {e}")
        # Return structured error instead of letting FastAPI's default 500 handler take it
        return {"error": str(e), "finished": False}
    
    return {
        "messages": game.messages,
        "resources": game.resources,
        "finished": not game.running,
        "winner": game.winner,
        "state": game.get_state(),
        "round": game.round
    }

@app.get("/api/battle/{battle_id}")
async def get_battle(battle_id: str):
    if battle_id not in battles:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    battle = battles[battle_id]
    game = battle["game"]
    return {
        "messages": game.messages,
        "resources": game.resources,
        "finished": not game.running,
        "winner": game.winner,
        "state": game.get_state(),
        "round": game.round
    }


@app.post("/api/battle/stop")
def stop_battle(battle_id: str):
    if battle_id not in battles:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    battle = battles[battle_id]
    game = battle["game"]
    game.running = False
    battles.clear()
    return {"status": "stopped", "battleId": battle_id}

# Serve static files
if os.path.exists("./backend/static"):
    app.mount("/", StaticFiles(directory="./backend/static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)