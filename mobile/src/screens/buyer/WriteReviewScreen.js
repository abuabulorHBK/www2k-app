import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useApi } from '../../hooks/useApi';

const COLORS = {
    primary: '#6C47FF',
    bg: '#0F0F14',
    card: '#1A1A24',
    text: '#FFFFFF',
    muted: '#8B8B9E',
    border: '#2E2E3E',
    star: '#FFD700',
};

export default function WriteReviewScreen({ route, navigation }) {
    const { order } = route.params;
    const api = useApi();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        if (!comment.trim()) {
            Alert.alert('Required', 'Please enter a comment.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/reviews', {
                order_id: order.id,
                seller_id: order.seller_id,
                rating,
                comment: comment.trim(),
            });
            Alert.alert('Success', 'Thank you for your review!', [{
                text: 'OK', onPress: () => navigation.goBack()
            }]);
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Review Order</Text>
                <View style={{ width: 50 }} />
            </View>

            <View style={styles.body}>
                <Text style={styles.label}>Rate your experience with {order.seller?.store_name}</Text>
                <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map(s => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                            <Text style={[styles.star, { color: s <= rating ? COLORS.star : COLORS.border }]}>
                                ★
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Detailed Feedback</Text>
                <TextInput
                    style={styles.input}
                    placeholder="What did you like? Was the food good? (Visible to other students)"
                    placeholderTextColor={COLORS.muted}
                    multiline
                    numberOfLines={6}
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                />

                <TouchableOpacity
                    style={[styles.btn, submitting && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Post Review</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderColor: COLORS.border
    },
    cancel: { color: COLORS.muted, fontSize: 16 },
    title: { color: '#fff', fontSize: 18, fontWeight: '700' },
    body: { padding: 20 },
    label: { color: COLORS.text, fontSize: 15, fontWeight: '600', marginBottom: 12 },
    stars: { flexDirection: 'row', gap: 10, marginBottom: 32, justifyContent: 'center' },
    star: { fontSize: 44 },
    input: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 140,
        marginBottom: 24,
    },
    btn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
