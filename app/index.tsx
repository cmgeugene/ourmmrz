import { View, Text } from "react-native";

export default function Page() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>Date Timeline App</Text>
            <Text style={{ color: '#888' }}>Initialized with Expo</Text>
        </View>
    );
}
