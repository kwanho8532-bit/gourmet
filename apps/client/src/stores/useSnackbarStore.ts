import { create } from 'zustand'

interface SnackbarData {
    visible: boolean;
    message: string;
    duration: number;
    actionLabel?: string;
    onActionPress?: () => void;
    type: 'default' | 'error' | 'success' | 'info';
}

interface SnackbarOptions {
    message: string;
    duration?: number;
    actionLabel?: string;
    onActionPress?: () => void;
    type?: 'default' | 'error' | 'success' | 'info';
}

interface SnackbarAction {
    showSnackbar: (options: SnackbarOptions) => void;
    hideSnackbar: () => void;
}

type SnackbarState = SnackbarData & SnackbarAction

export const useSnackbarStore = create<SnackbarState>((set, get) => ({
    visible: false,
    message: '',
    duration: 3000,
    actionLabel: undefined,
    onActionPress: undefined,
    type: 'default',

    showSnackbar: ({
        message,
        duration = 3000,
        actionLabel,
        onActionPress,
        type = 'default',
    }) => set({
        visible: true,
        message,
        duration,
        actionLabel,
        onActionPress,
        type,
    }),

    hideSnackbar: () => set({ visible: false })
}))