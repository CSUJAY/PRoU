// public/js/app.js - FINAL COMPLETE AND CORRECTED CODE

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Core Elements
    const employeeList = document.getElementById('employee-list');
    const taskListContainer = document.getElementById('task-list-container'); 
    const logoutButton = document.getElementById('logout-btn') || document.getElementById('logout-button'); 
    
    // Modal Elements
    const modal = document.getElementById('modal');
    const modalForm = document.getElementById('modal-form');
    const modalTitle = document.getElementById('modal-title');
    const modalCloseButton = document.getElementById('modal-close-button');
    const addEmployeeButton = document.getElementById('add-employee-button');
    const addTaskButton = document.getElementById('add-task-button'); 
    
    // Filter/Search/Sort Elements
    const employeeSearchInput = document.getElementById('employee-search');
    const employeeFilterDept = document.getElementById('employee-filter-dept');
    const employeeTable = document.getElementById('employee-table');
    const taskFilterStatus = document.getElementById('task-filter-status');
    const taskFilterDueDate = document.getElementById('task-filter-due-date');
    const taskSearchInput = document.getElementById('task-search') || document.getElementById('main-task-search'); 
    
    // Metrics Elements 
    const metricLow = document.getElementById('metric-low');       
    const metricMedium = document.getElementById('metric-medium'); 
    const metricHigh = document.getElementById('metric-high');     
    const metricTotal = document.getElementById('metric-total');
    const metricDone = document.getElementById('metric-done');
    const metricOverdue = document.getElementById('metric-overdue');
    
    let employeesData = []; 
    let tasksData = [];     
    let currentEditId = null; 
    let currentModalType = null;
    let taskStatusChart = null; 

    // --- 1. Security Check & Setup ---

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = 'index.html';
        });
    }
    
    // --- 2. Data Fetching Functions ---

    const fetchEmployees = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() });
            
            if (!response.ok) {
                if (response.status === 401) throw new Error('Unauthorized');
                throw new Error('Failed to fetch employees');
            }
            
            employeesData = await response.json();
            if (employeeFilterDept) populateDepartmentFilter(employeesData); 
            applyEmployeeFiltersAndSort(); 
            
        } catch (error) {
            console.error('Employee Fetch Error:', error);
            if (error.message === 'Unauthorized') {
                alert('Session expired. Please log in again.');
                window.location.href = 'index.html';
            }
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, { headers: getAuthHeaders() });
            
            if (!response.ok) throw new Error('Failed to fetch tasks');
            
            tasksData = await response.json();
            applyTaskFilters(); 
            fetchAndRenderMetrics(); 
            
        } catch (error) {
            console.error('Task Fetch Error:', error);
        }
    };
    
    // --- 3. Rendering Functions ---

    const renderEmployees = (data) => {
        if (!employeeList) return; 
        employeeList.innerHTML = ''; 
        data.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${employee.role}</td>
                <td>${employee.department}</td>
                <td>
                    <button data-id="${employee.employee_id}" class="edit-employee-btn">Edit</button>
                    <button data-id="${employee.employee_id}" class="delete-employee-btn">Delete</button>
                </td>
            `;
            employeeList.appendChild(row);
        });
        
        document.querySelectorAll('.edit-employee-btn').forEach(button => {
             button.addEventListener('click', (e) => {
                 const id = e.target.dataset.id;
                 const employee = employeesData.find(emp => emp.employee_id == id);
                 openEmployeeModal(employee);
             });
        });
        
        document.querySelectorAll('.delete-employee-btn').forEach(button => {
            button.addEventListener('click', deleteEmployee); 
        });
    };

    // --- TASK RENDERING FOR CARD LAYOUT (FIXED) ---
    const renderTasks = (data) => {
        if (!taskListContainer) return; 
        taskListContainer.innerHTML = ''; 
        data.forEach(task => {
            const employeeName = task.employee_name || 'Unassigned'; 
            const statusClass = task.status.toLowerCase().replace(' ', '-');
            const priority = task.priority || 'Medium'; // Placeholder
            
            const card = document.createElement('div');
            card.classList.add('task-card');
            
            card.innerHTML = `
                <span class="card-task-title">${task.title}</span>
                <span class="card-assigned-to">
                    <span class="initial-circle">${employeeName[0]}</span>
                    ${employeeName}
                </span>
                <span class="card-priority">
                    <span class="metric-flag ${priority.toLowerCase()}"></span>
                    ${priority}
                </span>
                <span class="card-status">
                    <span class="status-pill ${statusClass}">${task.status}</span>
                </span>
                <span class="card-due-date">${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span>
                <span class="card-actions">
                    <button data-id="${task.task_id}" class="edit-task-btn">Edit</button>
                    <button data-id="${task.task_id}" class="delete-task-btn">Delete</button>
                </span>
            `;
            taskListContainer.appendChild(card);
        });
        
        // Event listeners for Task buttons
        document.querySelectorAll('.edit-task-btn').forEach(button => {
             button.addEventListener('click', (e) => {
                 const id = e.target.dataset.id;
                 const task = tasksData.find(t => t.task_id == id);
                 openTaskModal(task); 
             });
        });
        
        document.querySelectorAll('.delete-task-btn').forEach(button => {
            button.addEventListener('click', deleteTask); 
        });
    };
    
    // --- 4. Filters, Search, and Sort Logic (BONUS: Advanced UI) ---
    
    // A. Employee Filtering and Sorting
    
    const populateDepartmentFilter = (data) => {
        if (!employeeFilterDept) return;
        const departments = [...new Set(data.map(emp => emp.department))];
        employeeFilterDept.innerHTML = '<option value="">Filter by Department</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            employeeFilterDept.appendChild(option);
        });
    };

    const applyEmployeeFiltersAndSort = () => {
        let filteredData = [...employeesData];
        
        // 1. Search Filter (by Name or Role)
        const searchTerm = employeeSearchInput && employeeSearchInput.value ? employeeSearchInput.value.toLowerCase() : '';
        if (searchTerm) {
            filteredData = filteredData.filter(emp =>
                emp.name.toLowerCase().includes(searchTerm) ||
                emp.role.toLowerCase().includes(searchTerm)
            );
        }

        // 2. Department Filter
        const selectedDept = employeeFilterDept ? employeeFilterDept.value : '';
        if (selectedDept) {
            filteredData = filteredData.filter(emp => emp.department === selectedDept);
        }
        
        // 3. Sorting (Simple sorting by name as default if no header is clicked)
        filteredData.sort((a, b) => a.name.localeCompare(b.name));

        renderEmployees(filteredData);
    };

    // B. Task Filtering
    
    const applyTaskFilters = () => {
        let filteredData = [...tasksData];
        
        // 1. Status Filter
        const selectedStatus = taskFilterStatus ? taskFilterStatus.value : '';
        if (selectedStatus) {
            filteredData = filteredData.filter(task => task.status === selectedStatus);
        }

        // 2. Due Date Filter
        const selectedDate = taskFilterDueDate ? taskFilterDueDate.value : ''; 
        if (selectedDate) {
            filteredData = filteredData.filter(task => task.due_date && task.due_date.startsWith(selectedDate));
        }
        
        // 3. Task Search Filter (Title)
        const taskSearchTerm = taskSearchInput ? taskSearchInput.value.toLowerCase() : '';
        if (taskSearchTerm) {
             filteredData = filteredData.filter(task => task.title.toLowerCase().includes(taskSearchTerm));
        }

        renderTasks(filteredData);
    };

    // C. Event Listeners for Filters/Search/Sort
    if (employeeSearchInput) employeeSearchInput.addEventListener('input', applyEmployeeFiltersAndSort);
    if (employeeFilterDept) employeeFilterDept.addEventListener('change', applyEmployeeFiltersAndSort);
    if (taskFilterStatus) taskFilterStatus.addEventListener('change', applyTaskFilters);
    if (taskFilterDueDate) taskFilterDueDate.addEventListener('change', applyTaskFilters);
    if (taskSearchInput) taskSearchInput.addEventListener('input', applyTaskFilters); 
    
    if (employeeTable) {
        employeeTable.querySelectorAll('th[data-sort-by]').forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = header.dataset.sortBy;
                let currentSortOrder = header.dataset.sortOrder === 'asc' ? 'desc' : 'asc';
                
                employeeTable.querySelectorAll('th').forEach(th => th.removeAttribute('data-sort-order'));
                header.dataset.sortOrder = currentSortOrder;
                
                employeesData.sort((a, b) => {
                    const aVal = a[sortBy];
                    const bVal = b[sortBy];
                    
                    if (currentSortOrder === 'asc') {
                        return aVal.localeCompare(bVal);
                    } else {
                        return bVal.localeCompare(aVal);
                    }
                });
                
                applyEmployeeFiltersAndSort(); 
            });
        });
    }

    // --- 5. Data Visualization Logic (BONUS: Metrics) ---
    
    const fetchAndRenderMetrics = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/metrics`, { headers: getAuthHeaders() });
            
            if (!response.ok) throw new Error('Failed to fetch metrics');
            
            const metrics = await response.json();
            
            // Update Metric Cards
            if (metricLow) metricLow.textContent = metrics['Low'] || 0;
            if (metricMedium) metricMedium.textContent = metrics['Medium'] || 0;
            if (metricHigh) metricHigh.textContent = metrics['High'] || 0;
            if (metricTotal) metricTotal.textContent = metrics['Total'] || 0; 
            if (metricDone) metricDone.textContent = metrics['Done'] || 0; 
            if (metricOverdue) metricOverdue.textContent = metrics['Overdue'] || 0;
            
            const labels = ['Pending', 'In Progress', 'Complete'];
            const data = [metrics['Pending'], metrics['In Progress'], metrics['Complete']]; // Corrected data source
            
            const ctx = document.getElementById('taskStatusChart');
            if (!ctx) return; 

            // FIX: Get the 2D context of the canvas element
            const chartContext = ctx.getContext('2d');

            if (taskStatusChart) {
                taskStatusChart.destroy();
            }

            taskStatusChart = new Chart(chartContext, { // Use the 2D context
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            'rgb(255, 99, 132)',
                            'rgb(255, 205, 86)',
                            'rgb(75, 192, 192)'
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Task Completion Status' }
                    }
                }
            });
            
        } catch (error) {
            console.error('Metrics Fetch Error:', error);
        }
    };


    // --- 6. Modal Handlers ---

    const closeModal = () => {
        if (!modal) return;
        modal.style.display = 'none';
        modalForm.reset(); 
        modalForm.innerHTML = ''; 
        currentEditId = null;
        currentModalType = null;
    };

    if (modalCloseButton) modalCloseButton.addEventListener('click', closeModal);

    const openEmployeeModal = (employee = null) => {
        if (!modal) return;
        currentModalType = 'employee';
        modalTitle.textContent = employee ? 'Edit Employee' : 'Add New Employee';
        modal.style.display = 'block';
        currentEditId = employee ? employee.employee_id : null;

        modalForm.innerHTML = `
            <input type="text" id="emp-name" placeholder="Name" value="${employee ? employee.name : ''}" required>
            <input type="text" id="emp-role" placeholder="Role" value="${employee ? employee.role : ''}" required>
            <input type="text" id="emp-dept" placeholder="Department" value="${employee ? employee.department : ''}" required>
            <button type="submit" id="modal-submit-button">${employee ? 'Update Employee' : 'Save Employee'}</button>
            <button type="button" id="modal-close-button-inner">Cancel</button>
        `;
        document.getElementById('modal-close-button-inner').addEventListener('click', closeModal);
    };
    
    const openTaskModal = (task = null) => {
        if (!modal) return;
        currentModalType = 'task';
        modalTitle.textContent = task ? 'Edit Task' : 'Assign New Task';
        modal.style.display = 'block';
        currentEditId = task ? task.task_id : null;

        const employeeOptions = employeesData.map(emp => 
            `<option value="${emp.employee_id}" ${task && task.employee_id == emp.employee_id ? 'selected' : ''}>${emp.name} (${emp.role})</option>`
        ).join('');
        
        const formattedDate = task && task.due_date ? task.due_date.substring(0, 10) : '';

        modalForm.innerHTML = `
            <input type="text" id="task-title" placeholder="Title" value="${task ? task.title : ''}" required>
            <textarea id="task-desc" placeholder="Description">${task ? task.description : ''}</textarea>
            <select id="task-status" required>
                <option value="Pending" ${task && task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="In Progress" ${task && task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Complete" ${task && task.status === 'Complete' ? 'selected' : ''}>Complete</option>
            </select>
            <select id="task-priority" required>
                <option value="Low" ${task && task.priority === 'Low' ? 'selected' : ''}>Low Priority</option>
                <option value="Medium" ${task && task.priority === 'Medium' ? 'selected' : ''}>Medium Priority</option>
                <option value="High" ${task && task.priority === 'High' ? 'selected' : ''}>High Priority</option>
            </select>
            <input type="date" id="task-due-date" value="${formattedDate}">
            <select id="task-employee-id" required>
                <option value="">-- Assign Employee --</option>
                ${employeeOptions}
            </select>
            <button type="submit" id="modal-submit-button">${task ? 'Update Task' : 'Assign Task'}</button>
            <button type="button" id="modal-close-button-inner">Cancel</button>
        `;
        document.getElementById('modal-close-button-inner').addEventListener('click', closeModal);
    };


    // Event listeners to open Modals
    if (addEmployeeButton) addEmployeeButton.addEventListener('click', () => openEmployeeModal());
    if (addTaskButton) addTaskButton.addEventListener('click', () => {
        if (employeesData.length === 0) {
            alert("Please add at least one employee before assigning a task.");
            return;
        }
        openTaskModal();
    });


    // --- 7. Unified Form Submission (CREATE/UPDATE Logic) ---

    if (modalForm) {
        modalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (currentModalType === 'employee') {
                const name = document.getElementById('emp-name').value;
                const role = document.getElementById('emp-role').value;
                const department = document.getElementById('emp-dept').value;

                const method = currentEditId ? 'PUT' : 'POST';
                const url = currentEditId ? `${API_BASE_URL}/employees/${currentEditId}` : `${API_BASE_URL}/employees`;

                try {
                    const response = await fetch(url, {
                        method: method,
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ name, role, department })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Employee API call failed');
                    }

                    closeModal();
                    fetchEmployees(); 
                    
                } catch (error) {
                        console.error('Employee Save Error:', error);
                        alert(`Error saving employee: ${error.message}`);
                }
            }
            
            else if (currentModalType === 'task') {
                const title = document.getElementById('task-title').value;
                const description = document.getElementById('task-desc').value;
                const status = document.getElementById('task-status').value;
                const due_date = document.getElementById('task-due-date').value;
                const employee_id = document.getElementById('task-employee-id').value;
                
                if (!employee_id) return alert("Please assign an employee.");
                
                const priority = document.getElementById('task-priority').value; // Get new priority value

                const method = currentEditId ? 'PUT' : 'POST';
                const url = currentEditId ? `${API_BASE_URL}/tasks/${currentEditId}` : `${API_BASE_URL}/tasks`;

                try {
                    const response = await fetch(url, {
                        method: method,
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ title, description, status, due_date, employee_id, priority }) // Include priority
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Task API call failed');
                    }

                    closeModal();
                    fetchTasks(); 
                    
                } catch (error) {
                    console.error('Task Save Error:', error);
                    alert(`Error saving task: ${error.message}`);
                }
            }
        });
    }
    
    // --- 8. Employee/Task Delete Logic ---
    
    const deleteEmployee = async (e) => {
        const id = e.target.dataset.id;
        if (!confirm(`Are you sure you want to delete employee ID ${id}?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Employee API call failed');
            }

            fetchEmployees(); 
            fetchTasks(); 
            
        } catch (error) {
            console.error('Employee Delete Error:', error);
            alert(`Error deleting employee: ${error.message}`);
        }
    };

    const deleteTask = async (e) => {
        const id = e.target.dataset.id;
        if (!confirm(`Are you sure you want to delete task ID ${id}?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Task API call failed');
            }

            fetchTasks();
            
        } catch (error) {
            console.error('Task Delete Error:', error);
            alert(`Error deleting task: ${error.message}`);
        }
    };


    // --- 9. Initialize Dashboard ---

    const init = () => {
        fetchEmployees();
        fetchTasks();
    };

    init();
});