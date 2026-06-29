import React from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function ResponseModal({
  visible,
  onClose,
  ID,
  pythonResult,
  keywords,
  types,
  fraudRate,
  reminds,
  prevents,
  emotions,
  close
}) {
  const progress = fraudRate;
  const degrees = progress * 3.6;

  const gradientColor = `
    conic-gradient(
      green 0deg, 
      rgb(154, 205, 50) ${Math.min(degrees, 90)}deg, 
      yellow ${Math.min(degrees, 180)}deg, 
      orange ${Math.min(degrees, 270)}deg, 
      rgb(255, 68, 51) ${Math.min(degrees, 360)}deg,
      gainsboro ${Math.min(degrees, 360)}deg
    )
  `;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Fraud Rate Circle with Gradient */}
            <View style={styles.circleContainer}>
              <View style={[styles.circle, { backgroundImage: gradientColor }]}>
                <Text style={styles.percentage}>{fraudRate}%</Text>
              </View>
              <Text style={styles.subTitle}>詐騙相似度</Text>
            </View>

            {/* Tags */}
            <View style={styles.tagContainer}>
              <Text style={styles.tag}>#高風險</Text>
              <Text style={styles.tag}>#{types}</Text>
              {emotions && emotions.map((emotion, index) => (
                <Text style={styles.tag} key={index}>#{emotion}</Text>
              ))}
            </View>

            {/* Keyword */}
            <View style={styles.blocklr}>
              {/* 關鍵字卡片 */}
              <View style={styles.lrCard}>
                <View style={styles.blockHeader}>
                  <Text style={styles.blockTitle}>關鍵字</Text>
                </View>
                <Text style={styles.blockText}>{keywords.join(', ')}</Text>
              </View>

              {/* 類型卡片 */}
              <View style={styles.lrCard}>
                <View style={styles.blockHeader}>
                  <Text style={styles.blockTitle}>類型</Text>
                </View>
                <Text style={styles.blockText}>{types}</Text>
              </View>
            </View>


            {/* Reminder */}
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>提醒</Text>
              </View>
              <Text style={styles.blockText}>{reminds}</Text>
            </View>

            {/* Prevention */}
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>如何防範</Text>
              </View>
              <Text style={styles.blockText}>{prevents}</Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => {
              onClose();
              close();
            }}>
              <Text style={styles.closeBtnText}>關閉</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  scrollContent: {
    alignItems: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: 'gainsboro',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 10,
    borderColor: '#ccc',
  },
  percentage: {
    fontSize: 35,
    fontWeight: 'bold',
  },
  subTitle: {
    marginTop: 8,
    fontSize: 24,
    color: '#333',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
  },
  tag: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 5,
    fontSize: 18,
    color: '#444',
  },
  block: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    marginVertical: 8,
    width: '90%',
    marginRight:10,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  blockHeader: {
    backgroundColor: '#bfc08a',
    padding: 10,
  },
  blockTitle: {
    padding: 0,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#fff',
  },
  blockText: {
    padding:6,
    fontSize: 14,
    color: '#444',
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  blocklr: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12,
},

lrCard: {
  flex: 1,
  marginHorizontal: 5,
  backgroundColor: '#f7f7f7',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ccc',
  overflow: 'hidden',
},

});