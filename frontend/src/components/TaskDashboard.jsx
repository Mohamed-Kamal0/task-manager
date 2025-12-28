import { useState, useMemo } from "react";
import axios from "axios";
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  keepPreviousData 
} from "@tanstack/react-query";

export default function TaskDashboard({ token, setToken }) {
  const [page, setPage] = useState(1);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [editingTask, setEditingTask] = useState(null);

  const queryClient = useQueryClient();

  // Memoize API instance
  const api = useMemo(() => axios.create({
    baseURL: "http://localhost:5000",
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  // --- 1. FETCH TASKS (Query) ---
  const fetchTasks = async (pageNum) => {
    const res = await api.get(`/tasks?page=${pageNum}&limit=5`);
    return res.data; // Returns { tasks, currentPage, totalPages, totalTasks }
  };

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ['tasks', page], // Refetch when 'page' changes
    queryFn: () => fetchTasks(page),
    placeholderData: keepPreviousData, // Keeps old data visible while new data loads
    retry: false, // Don't retry on 401s
  });

  // Handle Logout on 401 error
  if (isError && error.response?.status === 401) {
    setToken(null);
  }

  // --- 2. MUTATIONS (Add, Edit, Delete) ---

  // Add Task
  const addMutation = useMutation({
    mutationFn: (newTodo) => api.post("/tasks", newTodo),
    onSuccess: () => {
      setNewTask({ title: "", description: "" });
      setPage(1); // Reset to first page to see new item
      queryClient.invalidateQueries(['tasks']); // Refetch data
    },
  });

  // Update Task
  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }) => api.put(`/tasks/${id}`, updates),
    onSuccess: () => {
      setEditingTask(null);
      queryClient.invalidateQueries(['tasks']);
    },
  });

  // Delete Task
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });

  // --- HANDLERS ---
  
  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    addMutation.mutate(newTask);
  };

  const handleUpdate = (task, updates) => {
    updateMutation.mutate({ id: task.id, ...task, ...updates });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure?")) {
      deleteMutation.mutate(id);
    }
  };

  // Safe access to data
  const tasks = data?.tasks || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>
        <button
          onClick={() => setToken(null)}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAdd} className="bg-white p-6 rounded shadow mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-bold mb-1">Title</label>
          <input
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="What needs to be done?"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-bold mb-1">Description</label>
          <input
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="Details (optional)"
          />
        </div>
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 h-10 disabled:bg-gray-400"
        >
          {addMutation.isPending ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading tasks...</p>
        ) : (
          <>
            {tasks.map((task) => (
              <div key={task.id} className={`bg-white p-4 rounded shadow flex justify-between items-center border-l-4 border-blue-500 ${isPlaceholderData ? 'opacity-50' : ''}`}>
                {editingTask === task.id ? (
                  <div className="flex-1 mr-4">
                    <input
                      className="border p-1 mr-2"
                      defaultValue={task.title}
                      id={`title-${task.id}`}
                    />
                    <button
                      onClick={() => handleUpdate(task, { title: document.getElementById(`title-${task.id}`).value })}
                      className="text-green-600 font-bold mr-2"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingTask(null)} className="text-gray-500">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${task.status === "done" ? "line-through text-gray-400" : ""}`}>
                      {task.title}
                    </h3>
                    <p className="text-gray-600">{task.description}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${task.status === "done" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdate(task, { status: e.target.value })}
                    className="border rounded p-1 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button onClick={() => setEditingTask(task.id)} className="text-blue-500 hover:text-blue-700">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {tasks.length === 0 && <p className="text-center text-gray-500">No tasks found.</p>}

            {/* Pagination Controls */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((old) => Math.max(old - 1, 1))}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="py-2">
                Page {page} of {totalPages}
              </span>
              <button
                // Disable next if we are on the last page OR if we are currently fetching placeholder data
                disabled={isPlaceholderData || page >= totalPages}
                onClick={() => setPage((old) => old + 1)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}