from fastapi import APIRouter
import json
import os

router = APIRouter()


@router.get("/avatars")
async def get_avatars():
    """Get list of available avatar presets."""
    # Read avatars.json from web app's public folder
    # In production, this should be served directly by Next.js
    # For now, we'll return a static list
    avatars = [
        {
            "id": "circle-blue",
            "name": "Blue Circle",
            "path": "/avatars/circle-blue.png",
            "description": "Blue geometric circle pattern"
        },
        {
            "id": "square-green",
            "name": "Green Square",
            "path": "/avatars/square-green.png",
            "description": "Green diamond pattern"
        },
        {
            "id": "hexagon-purple",
            "name": "Purple Hexagon",
            "path": "/avatars/hexagon-purple.png",
            "description": "Purple hexagon with stars"
        },
        {
            "id": "triangle-orange",
            "name": "Orange Triangle",
            "path": "/avatars/triangle-orange.png",
            "description": "Orange triangle pattern"
        },
        {
            "id": "diamond-red",
            "name": "Red Diamond",
            "path": "/avatars/diamond-red.png",
            "description": "Red diamond grid pattern"
        },
        {
            "id": "star-yellow",
            "name": "Yellow Star",
            "path": "/avatars/star-yellow.png",
            "description": "Yellow star with dots"
        }
    ]
    
    return {"avatars": avatars}
