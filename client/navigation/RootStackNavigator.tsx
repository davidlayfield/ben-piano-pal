import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TunerScreen from "@/screens/TunerScreen";

export type RootStackParamList = {
  Tuner: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#0A0A0A",
        },
      }}
    >
      <Stack.Screen name="Tuner" component={TunerScreen} />
    </Stack.Navigator>
  );
}
