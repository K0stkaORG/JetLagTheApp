import { StyleSheet, View } from "react-native";
import { useAuth, useUser } from "~/context/auth";
import { useEffect, useState } from "react";

import { Asset } from "expo-asset";
import AsyncButton from "~/components/AsyncButton";
import { T } from "~/components/ui/text";
import Map from "~/components/Map";

export default function Screen() {
    const user = useUser();
    const { logout } = useAuth();

    return (
        <View style={styles.container}>
            <T>Welcome to the App! {user.nickname}</T>

            <View style={styles.mapContainer}>
                <Map style={styles.map} />
            </View>

            <AsyncButton onPress={logout}>
                <T>Logout</T>
            </AsyncButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    mapContainer: {
        height: 300,
        marginVertical: 16,
        borderRadius: 8,
        overflow: "hidden",
    },
    map: {
        flex: 1,
    },
});
