import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Hook to listen to admin dashboard live updates via WebSocket
 * @param {Function} onUpdate - callback invoked when update is received: (data) => void
 */
export function useAdminSocket(onUpdate) {
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleDashboardUpdate = (data) => {
            console.log('[Live Dashboard Update]', data);
            if (onUpdate) {
                onUpdate(data);
            }
        };

        socket.on('dashboard:update', handleDashboardUpdate);

        return () => {
            socket.off('dashboard:update', handleDashboardUpdate);
        };
    }, [socket, isConnected, onUpdate]);

    return { isConnected };
}
