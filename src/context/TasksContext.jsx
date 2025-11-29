import React, { createContext, useState, useContext } from 'react';

const TasksContext = createContext();

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return context;
};

export const TasksProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);

  const addTask = (task) => {
    setTasks((prev) => [...prev, task]);
  };

  const addHabit = (habit) => {
    setHabits((prev) => [...prev, habit]);
  };

  const addGoal = (goal) => {
    setGoals((prev) => [...prev, goal]);
  };

  const toggleTaskComplete = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const toggleHabitComplete = (habitId) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
      )
    );
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const deleteHabit = (habitId) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
  };

  const toggleGoalComplete = (goalId) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  const deleteGoal = (goalId) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        habits,
        goals,
        addTask,
        addHabit,
        addGoal,
        toggleTaskComplete,
        toggleHabitComplete,
        toggleGoalComplete,
        deleteTask,
        deleteHabit,
        deleteGoal,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

