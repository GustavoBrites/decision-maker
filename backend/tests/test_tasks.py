def test_create_task(client, auth_header):
    response = client.post("/api/tasks", json={
        "title": "New Task",
        "estimatedMinutes": 30,
        "energy": "medium"
    }, headers=auth_header)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Task"
    assert data["id"] is not None

def test_get_tasks(client, auth_header):
    client.post("/api/tasks", json={"title": "T1", "estimatedMinutes": 10, "energy": "low"}, headers=auth_header)
    client.post("/api/tasks", json={"title": "T2", "estimatedMinutes": 20, "energy": "high"}, headers=auth_header)
    
    response = client.get("/api/tasks", headers=auth_header)
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_complete_task(client, auth_header):
    create_res = client.post("/api/tasks", json={"title": "T1", "estimatedMinutes": 10, "energy": "low"}, headers=auth_header)
    task_id = create_res.json()["id"]
    
    response = client.put(f"/api/tasks/{task_id}/complete", json={"actualMinutes": 15}, headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] is True
    assert data["completedMinutes"] == 15

def test_delete_task(client, auth_header):
    create_res = client.post("/api/tasks", json={"title": "T1", "estimatedMinutes": 10, "energy": "low"}, headers=auth_header)
    task_id = create_res.json()["id"]
    
    response = client.delete(f"/api/tasks/{task_id}", headers=auth_header)
    assert response.status_code == 200
    
    get_res = client.get("/api/tasks", headers=auth_header)
    assert len(get_res.json()) == 0
