import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { TaskStorage, HabitStorage, GoalStorage } from '../services/StorageService';
import { DEV_CONFIG } from '../config/devConfig';
import { getSeedTasks, getSeedHabits, getSeedGoals } from '../../seed';

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
  const loaded = useRef(false);

  // Load from storage on mount (with optional seed injection)
  useEffect(() => {
    if (DEV_CONFIG.SEED_ENABLED) {
      const shouldSeed =
        DEV_CONFIG.SEED_MODE === 'always' ||
        (TaskStorage.getAll().length === 0 && HabitStorage.getAll().length === 0);

      if (shouldSeed) {
        const seedTasks = getSeedTasks();
        const seedHabits = getSeedHabits();
        const seedGoals = getSeedGoals();
        TaskStorage.saveAll(seedTasks);
        HabitStorage.saveAll(seedHabits);
        GoalStorage.saveAll(seedGoals);
        setTasks(seedTasks);
        setHabits(seedHabits);
        setGoals(seedGoals);
        loaded.current = true;
        return;
      }
    }

    setTasks(TaskStorage.getAll());
    setHabits(HabitStorage.getAll());
    setGoals(GoalStorage.getAll());
    loaded.current = true;
  }, []);

  // Persist on every change (guarded until after load)
  useEffect(() => { if (loaded.current) TaskStorage.saveAll(tasks); }, [tasks]);
  useEffect(() => { if (loaded.current) HabitStorage.saveAll(habits); }, [habits]);
  useEffect(() => { if (loaded.current) GoalStorage.saveAll(goals); }, [goals]);

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
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const isCompleted = task.status === 'completed';
        return {
          ...task,
          status: isCompleted ? 'pending' : 'completed',
          completedAt: isCompleted ? null : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const toggleHabitComplete = (habitId) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const isCompleted = habit.status === 'completed';
        return {
          ...habit,
          status: isCompleted ? 'pending' : 'completed',
          completedAt: isCompleted ? null : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
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
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const isCompleted = goal.status === 'completed';
        return {
          ...goal,
          status: isCompleted ? 'pending' : 'completed',
          completedAt: isCompleted ? null : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
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
