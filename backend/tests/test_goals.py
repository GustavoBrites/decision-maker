def test_create_goal(client, auth_header):
    response = client.post("/api/goals", json={
        "title": "Workout",
        "type": "body",
        "targetMinutes": 120
    }, headers=auth_header)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Workout"

def test_update_goal(client, auth_header):
    create_res = client.post("/api/goals", json={
        "title": "Workout",
        "type": "body",
        "targetMinutes": 120
    }, headers=auth_header)
    goal_id = create_res.json()["id"]
    
    response = client.put(f"/api/goals/{goal_id}", json={"targetMinutes": 150}, headers=auth_header)
    assert response.status_code == 200
    assert response.json()["targetMinutes"] == 150

def test_delete_goal(client, auth_header):
    create_res = client.post("/api/goals", json={
        "title": "Workout",
        "type": "body",
        "targetMinutes": 120
    }, headers=auth_header)
    goal_id = create_res.json()["id"]
    
    response = client.delete(f"/api/goals/{goal_id}", headers=auth_header)
    assert response.status_code == 200
    
    get_res = client.get("/api/goals", headers=auth_header)
    assert len(get_res.json()) == 0
