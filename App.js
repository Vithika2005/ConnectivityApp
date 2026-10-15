import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Vibration,
  Animated,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export default function App() {
  const [netState, setNetState] = useState({
    type: 'unknown',
    isConnected: false,
    isInternetReachable: null,
  });
  const [lastUpdated, setLastUpdated] = useState('');

  const prevConnected = useRef(null);
  const pulse = useRef(new Animated.Value(1)).current;

  // Store the new state, vibrate + animate if online/offline changed
  const handleState = useCallback((state) => {
    setNetState({
      type: state.type,
      isConnected: !!state.isConnected,
      isInternetReachable: state.isInternetReachable,
    });
    setLastUpdated(new Date().toLocaleTimeString());

    if (
      prevConnected.current !== null &&
      prevConnected.current !== !!state.isConnected
    ) {
      Vibration.vibrate(200);
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    prevConnected.current = !!state.isConnected;
  }, [pulse]);

  useEffect(() => {
    // 1. Initial one-time snapshot
    NetInfo.fetch().then(handleState);

    // 2. Live subscription
    const unsubscribe = NetInfo.addEventListener(handleState);

    // 3. Cleanup on unmount
    return () => unsubscribe();
  }, [handleState]);

  // Manual refresh
  const onRefresh = () => {
    NetInfo.fetch().then(handleState);
  };

  const online = netState.isConnected;

  const typeLabel = () => {
    if (!online) return 'No Connection';
    switch (netState.type) {
      case 'wifi':
        return 'Wi-Fi';
      case 'cellular':
        return 'Cellular';
      case 'ethernet':
        return 'Ethernet';
      default:
        return netState.type;
    }
  };

  const reachableLabel = () => {
    if (netState.isInternetReachable === null) return 'Internet reachability: checking...';
    return netState.isInternetReachable
      ? 'Internet reachability: Reachable'
      : 'Internet reachability: Not reachable';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Connectivity Status</Text>

      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: online ? '#2ecc71' : '#e74c3c', transform: [{ scale: pulse }] },
        ]}
      >
        <Text style={styles.indicatorText}>{online ? 'ONLINE' : 'OFFLINE'}</Text>
      </Animated.View>

      <Text style={styles.type}>{typeLabel()}</Text>
      <Text style={styles.reach}>{reachableLabel()}</Text>
      {lastUpdated !== '' && (
        <Text style={styles.updated}>Last updated: {lastUpdated}</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={onRefresh}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', marginBottom: 40 },
  indicator: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  indicatorText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  type: { fontSize: 22, fontWeight: '600', color: '#34495e', marginTop: 30 },
  reach: { fontSize: 16, color: '#7f8c8d', marginTop: 8 },
  updated: { fontSize: 13, color: '#95a5a6', marginTop: 6 },
  button: {
    marginTop: 40,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});