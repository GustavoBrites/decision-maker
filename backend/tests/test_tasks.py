def test_create_task(client):
    response = client.post("/tasks", json={
        "title": "New Task",
        "estimatedMinutes": 30,
        "energy": "medium"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Task"
    assert data["id"] is not None

def test_get_tasks(client):
    client.post("/tasks", json={"title": "T1", "estimatedMinutes": 10, "energy": "low"})
    client.post("/tasks", json={"title": "T2", "estimatedMinutes": 20, "energy": "high"})
    
    response = client.get("/tasks")
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_complete_task(client):
    create_res = client.post("/tasks", json={"title": "T1", "estimatedMinutes": 10, "energy": "low"})
    task_id = create_res.json()["id"]
    
    response = client.put(f"/tasks/{task_id}/complete", json={"actualMinutes": 15})
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] is True
    assert data["completedMinutes"] == 15

def test_delete_task(client):
    create_res = client.post("/tasks", json={"title": "T1", "estimatedMinutes": 10, "energy": "low"})
    task_id = create_res.json()["id"]
    
    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 200
    
    get_res = client.get("/tasks")
    assert len(get_res.json()) == 0
