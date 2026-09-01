import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const TasksScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('event_tasks')
      .select('*, events(title)')
      .eq('assigned_to', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setTasks(data);
    setLoading(false);
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    // Basic toggle between NOT_STARTED and COMPLETED for mobile simplicity
    const newStatus = currentStatus === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    
    // Optimistic UI update
    setTasks(tasks.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t));
    
    // Background sync
    await supabase.from('event_tasks').update({ status: newStatus }).eq('task_id', taskId);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'HIGH' || priority === 'CRITICAL') return '#F43F5E'; // Rose
    if (priority === 'MEDIUM') return '#F59E0B'; // Amber
    return '#3B82F6'; // Blue
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'COMPLETED';
    
    return (
      <TouchableOpacity 
        style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => toggleTaskStatus(item.task_id, item.status)}
      >
        <Ionicons 
          name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
          size={26} 
          color={isCompleted ? theme.primary : theme.textMuted} 
        />
        
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, { color: isCompleted ? theme.textMuted : theme.text, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>
            {item.title}
          </Text>
          <View style={styles.taskMeta}>
            <Text style={[styles.eventTitle, { color: theme.textMuted }]}>{item.events?.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>My Tasks</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Tasks assigned to you across all events.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>You're all caught up!</Text>
          <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>No tasks assigned to you right now.</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.task_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  taskContent: {
    marginLeft: 14,
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  }
});

export default TasksScreen;
