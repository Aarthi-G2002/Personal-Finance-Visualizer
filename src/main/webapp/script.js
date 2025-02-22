let transactions = [];
        let budgets = {};
        let editId = null;

        document.getElementById("budgetForm").addEventListener("submit", (e) => {
            e.preventDefault();
            let category = document.getElementById("budgetCategory").value;
            let amountInput = document.getElementById("budgetAmount");
            let amount = parseFloat(amountInput.value);

            if (amount <= 0) return alert("Enter a valid budget amount.");
            
            budgets[category] = amount;
            updateCharts();

           
            amountInput.value = "";
        });

        document.getElementById("transactionForm").addEventListener("submit", (e) => {
            e.preventDefault();
            let amountInput = document.getElementById("amount");
            let dateInput = document.getElementById("date");
            let descriptionInput = document.getElementById("description");
            let categoryInput = document.getElementById("category");

            let amount = parseFloat(amountInput.value);
            let date = dateInput.value;
            let description = descriptionInput.value;
            let category = categoryInput.value;

            if (amount <= 0 || !date || !description) return alert("Enter valid details.");
            
            if (editId !== null) {
               
                transactions = transactions.map(txn =>
                    txn.id === editId ? { id: editId, amount, date, description, category } : txn
                );
                editId = null;
            } else {
                
                transactions.push({ id: Date.now(), amount, date, description, category });
            }

            updateCharts();
            updateSummary();
            updateTransactionList();

           
            amountInput.value = "";
            dateInput.value = "";
            descriptionInput.value = "";
            categoryInput.selectedIndex = 0;
        });

        function updateTransactionList() {
            let transactionList = document.getElementById("transactionList");
            transactionList.innerHTML = "";

            transactions.forEach(txn => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>₹${txn.amount}</td>
                    <td>${txn.date}</td>
                    <td>${txn.description}</td>
                    <td>${txn.category}</td>
                    <td class="actions">
                        <button class="edit" onclick="editTransaction(${txn.id})">Edit</button>
                        <button class="delete" onclick="deleteTransaction(${txn.id})">Delete</button>
                    </td>
                `;
                transactionList.appendChild(row);
            });
        }

        window.editTransaction = (id) => {
            let txn = transactions.find(t => t.id === id);
            document.getElementById("amount").value = txn.amount;
            document.getElementById("date").value = txn.date;
            document.getElementById("description").value = txn.description;
            document.getElementById("category").value = txn.category;
            editId = id;
        };

        window.deleteTransaction = (id) => {
            transactions = transactions.filter(txn => txn.id !== id);
            updateCharts();
            updateSummary();
            updateTransactionList();
        };

        let expensesCtx = document.getElementById("expensesChart").getContext("2d");
        let budgetCtx = document.getElementById("budgetChart").getContext("2d");
        let pieCtx = document.getElementById("pieChart").getContext("2d");

        let expensesChart = new Chart(expensesCtx, {
            type: "bar",
            data: { labels: [], datasets: [
                { label: "Monthly Expenses", backgroundColor: "#db6882", data: [] } 
            ]}
        });

        let budgetChart = new Chart(budgetCtx, {
            type: "bar",
            data: { labels: [], datasets: [
                { label: "Budget", backgroundColor: "#4c956c", data: [] }, 
                { label: "Actual Spending", backgroundColor: "#db6882", data: [] } 
            ]}
        });

        let pieChart = new Chart(pieCtx, {
            type: "pie",
            data: { labels: [], datasets: [{ 
                backgroundColor: ["#ffadad", "#c095e4", "#fbaf87", "#aeb4ac", "#ab5852", "#f1b9e7"], // Shuttle colors
                data: [] 
            }] }
        });
		
		
        function updateCharts() {
            let monthlyData = {};
            let actualSpending = {};
            transactions.forEach(txn => {
                let month = txn.date.substring(0, 7); 
                monthlyData[month] = (monthlyData[month] || 0) + txn.amount;
                actualSpending[txn.category] = (actualSpending[txn.category] || 0) + txn.amount;
            });

            // Update Expenses Chart (Monthly Expenses)
            expensesChart.data.labels = Object.keys(monthlyData);
            expensesChart.data.datasets[0].data = Object.values(monthlyData);
            expensesChart.update();

            // Update Budget vs Actual Chart
            let categories = Object.keys(budgets);
            let budgetData = categories.map(cat => budgets[cat] || 0);
            let actualData = categories.map(cat => actualSpending[cat] || 0);

            budgetChart.data.labels = categories;
            budgetChart.data.datasets[0].data = budgetData;
            budgetChart.data.datasets[1].data = actualData;
            budgetChart.update();

            // Update Pie Chart (Spending Breakdown)
            pieChart.data.labels = Object.keys(actualSpending);
            pieChart.data.datasets[0].data = Object.values(actualSpending);
            pieChart.update();

            updateInsights(actualData, budgetData);
        }

        function updateSummary() {
            let total = transactions.reduce((sum, txn) => sum + txn.amount, 0);
            document.getElementById("totalExpenses").textContent = `₹${total}`;

            let categoryTotals = {};
            transactions.forEach(txn => {
                categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
            });

            let topCategory = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, "N/A");
            document.getElementById("topCategory").textContent = topCategory !== "N/A" ? `${topCategory} (₹${categoryTotals[topCategory]})` : "N/A";

            document.getElementById("recentTransactions").innerHTML = transactions.slice(-3).map(txn => `<li>${txn.description}: ₹${txn.amount}</li>`).join("");
        }

        function updateInsights(actual, budget) {
            let overBudgetCategories = [];
            actual.forEach((value, index) => {
                if (value > budget[index]) {
                    overBudgetCategories.push(budgetChart.data.labels[index]);
                }
            });

            if (overBudgetCategories.length > 0) {
                document.getElementById("spendingInsights").textContent = `Warning: Over budget in ${overBudgetCategories.join(", ")}!`;
            } else {
                document.getElementById("spendingInsights").textContent = "Good job! You're within budget.";
            }
        }