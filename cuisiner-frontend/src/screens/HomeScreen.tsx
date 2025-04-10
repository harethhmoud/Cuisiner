import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Cuisiner</Text>
          <Text style={styles.subtitle}>Your culinary journey starts here</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Recipes</Text>
          {/* Recipe cards will go here */}
          <View style={styles.placeholder}>
            <Text>Recipe cards will appear here</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular in Your Network</Text>
          {/* Social posts will go here */}
          <View style={styles.placeholder}>
            <Text>Popular posts will appear here</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollView: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  placeholder: {
    backgroundColor: '#E0E0E0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
});

export default HomeScreen; 