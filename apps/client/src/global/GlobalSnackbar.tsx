import { colors } from '@/constant/color';
import { useSnackbarStore } from '@/stores/useSnackbarStore';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';

export const GlobalSnackbar = () => {
    const { visible, message, duration, actionLabel, onActionPress, type, hideSnackbar } = useSnackbarStore();

    return (
        <Snackbar
            visible={visible}
            onDismiss={hideSnackbar}
            duration={duration}
            action={
                actionLabel
                    ? {
                        label: actionLabel,
                        onPress: () => {
                            if (onActionPress) onActionPress();
                            hideSnackbar();
                        },
                    }
                    : undefined
            }
            style={[
                styles.snackbar,
                type === 'error' && styles.errorSnackbar,
                type === 'success' && styles.successSnackbar,
                type === 'info' && styles.infoSnackbar
            ]}
        >
            {message}
        </Snackbar>
    );
};

const styles = StyleSheet.create({
    snackbar: {
        marginBottom: 20,
    },
    errorSnackbar: {
        backgroundColor: colors.red[400],
    },
    successSnackbar: {
        backgroundColor: colors.emerald[400],
    },
    infoSnackbar: {
        backgroundColor: colors.sky[400]
    }
});