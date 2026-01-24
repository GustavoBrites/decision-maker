def test_create_goal(client):
    response = client.post("/goals", json={
        "title": "Workout",
        "type": "body",
        "targetMinutes": 120
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Workout"

def test_update_goal(client):
    create_res = client.post("/goals", json={
        "title": "Workout",
        "type": "body",
        "targetMinutes": 120
    })
    goal_id = create_res.json()["id"]
    
    response = client.put(f"/goals/{goal_id}", json={"targetMinutes": 150})
    assert response.status_code == 200
    assert response.json()["targetMinutes"] == 150

def test_delete_goal(client):
    create_res = client.post("/goals", json={
        "title": "Workout",
        "type": "body",
        "targetMinutes": 120
    })
    goal_id = create_res.json()["id"]
    
    response = client.delete(f"/goals/{goal_id}")
    assert response.status_code == 200
    
    get_res = client.get("/goals")
    assert len(get_res.json()) == 0
