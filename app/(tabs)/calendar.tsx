import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuth } from '../../components/ctx/AuthContext';
import { EventService } from '../../services/eventService';
import { TimelineEvent } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { PLACE_CATEGORIES } from '../../constants/categories';
import { CompactStarRatingDisplay } from '../../components/StarRating';

export default function CalendarScreen() {
    const { coupleId } = useAuth();
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);

    // Load events for the current month
    const loadMonthEvents = async (dateString: string) => {
        if (!coupleId) return;
        setLoading(true);
        try {
            const date = parseISO(dateString);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const fetchedEvents = await EventService.getEventsByMonth(coupleId, year, month);
            setEvents(fetchedEvents);

            // Generate marked dates
            const marks: any = {};
            fetchedEvents.forEach(event => {
                const day = event.event_date.split('T')[0];
                marks[day] = { marked: true, dotColor: '#EC4899' };
            });

            // Mark selected date
            marks[selectedDate] = {
                ...marks[selectedDate],
                selected: true,
                selectedColor: '#3B82F6'
            };

            setMarkedDates(marks);
        } catch (error) {
            console.error('Error loading calendar events:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and when selected date changes
    useEffect(() => {
        updateFilteredEvents();
        // Update selection visualizing
        setMarkedDates((prev: any) => {
            const newMarks = { ...prev };
            // Reset previous selection
            Object.keys(newMarks).forEach(key => {
                if (newMarks[key].selected) {
                    delete newMarks[key].selected;
                    delete newMarks[key].selectedColor;
                }
            });
            // Set new selection
            if (newMarks[selectedDate]) {
                newMarks[selectedDate] = { ...newMarks[selectedDate], selected: true, selectedColor: '#3B82F6' };
            } else {
                newMarks[selectedDate] = { selected: true, selectedColor: '#3B82F6' };
            }
            return newMarks;
        });
    }, [selectedDate, events]);

    useFocusEffect(
        useCallback(() => {
            loadMonthEvents(currentMonth);
        }, [currentMonth])
    );

    const updateFilteredEvents = () => {
        const filtered = events.filter(e => e.event_date.startsWith(selectedDate));
        setFilteredEvents(filtered);
    };

    const handleDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);
    };

    const handleMonthChange = (month: DateData) => {
        setCurrentMonth(month.dateString);
        loadMonthEvents(month.dateString);
    };

    const getCategoryIcon = (item: TimelineEvent) => {
        // Priority 1: Category field
        if (item.category) {
            const category = PLACE_CATEGORIES.find(c => c.id === item.category);
            return category ? category.icon : 'location';
        }

        // Priority 2: Keyword fallback
        const matchingCategory = PLACE_CATEGORIES.find(cat =>
            item.keywords && item.keywords.some(k => cat.keywords.includes(k))
        );
        return matchingCategory ? matchingCategory.icon : 'location';
    };

    const renderEventItem = ({ item, index }: { item: TimelineEvent, index: number }) => {
        const isLastItem = index === filteredEvents.length - 1;

        return (
            <View className="flex-row">
                {/* Timeline Node (Category Icon) & Line */}
                <View className="items-center mr-4 w-10">
                    {/* Top Line (connects to previous) */}
                    {index > 0 && <View className="w-0.5 h-4 bg-gray-200 bg-opacity-50" />}

                    {/* Category Icon Node */}
                    <View className="w-8 h-8 rounded-full bg-white border border-gray-200 items-center justify-center z-10 shadow-sm">
                        <Ionicons name={getCategoryIcon(item) as any} size={14} color="#3B82F6" />
                    </View>

                    {/* Bottom Line (connects to next) */}
                    {!isLastItem && <View className="w-0.5 flex-1 bg-gray-200 bg-opacity-50 -mt-1" />}
                </View>

                {/* Content Card */}
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/view-event', params: { id: item.id } })}
                    className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-row items-center mb-4"
                >
                    <View className="flex-1">
                        <View className="flex-row items-center">
                            <Text className="text-gray-900 font-bold font-sans text-base mr-2" numberOfLines={1}>
                                {item.location || item.description || "No details"}
                            </Text>
                            {/* Star Rating */}
                            {item.rating ? (
                                <CompactStarRatingDisplay rating={item.rating} size={12} color="#FBBF24" />
                            ) : null}
                        </View>

                        {item.location && item.description ? (
                            <Text className="text-gray-400 text-xs font-sans mt-1" numberOfLines={1}>
                                {item.description}
                            </Text>
                        ) : null}
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-surface">
            {/* Header */}
            <View className="pt-14 pb-4 px-6 bg-white z-10 shadow-sm">
                <Text className="text-2xl font-bold text-gray-900 font-sans">Calendar</Text>
            </View>

            {/* Calendar View */}
            <View className="bg-white">
                <Calendar
                    current={currentMonth}
                    onDayPress={handleDayPress}
                    onMonthChange={handleMonthChange}
                    markedDates={markedDates}
                    theme={{
                        todayTextColor: '#EC4899',
                        arrowColor: '#3B82F6',
                        textDayFontFamily: 'PlusJakartaSans_500Medium',
                        textMonthFontFamily: 'PlusJakartaSans_700Bold',
                        textDayHeaderFontFamily: 'PlusJakartaSans_500Medium',
                    }}
                />
            </View>

            {/* Selected Date Header */}
            <View className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <Text className="text-gray-500 font-bold font-sans text-sm uppercase tracking-wider">
                    {format(parseISO(selectedDate), 'MMMM d, yyyy')}
                </Text>
            </View>

            {/* Event List */}
            <View className="flex-1 px-6 pt-4">
                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" className="mt-10" />
                ) : filteredEvents.length > 0 ? (
                    <FlatList
                        data={filteredEvents}
                        keyExtractor={(item) => item.id}
                        renderItem={renderEventItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                ) : (
                    <View className="items-center justify-center mt-10 opacity-50">
                        <Ionicons name="leaf-outline" size={48} color="#9CA3AF" />
                        <Text className="text-gray-400 font-sans mt-2">No memories this day</Text>
                    </View>
                )}
            </View>
        </View>
    );
}
