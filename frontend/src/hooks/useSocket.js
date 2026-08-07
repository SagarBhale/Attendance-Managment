import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectToken } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socketInstance = null;

const useSocket = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectToken);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !token) return;

    if (!socketInstance) {
      socketInstance = io(BASE_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    }

    socketRef.current = socketInstance;

    // Join user-specific and role-specific rooms
    socketInstance.emit('join', { userId: user._id, role: user.role });

    // Listen for events
    socketInstance.on('overtime:reviewed', (data) => {
      const emoji = data.status === 'approved' ? '✅' : '❌';
      toast(`${emoji} Overtime request ${data.status}${data.reviewNote ? `: ${data.reviewNote}` : ''}`, {
        duration: 5000,
      });
    });

    socketInstance.on('attendance:validated', (data) => {
      const emoji = data.validationStatus === 'valid' ? '✅' : '⚠️';
      toast(`${emoji} Your attendance for ${data.date} marked as ${data.validationStatus}${data.remarks ? ` — ${data.remarks}` : ''}`, {
        duration: 5000,
      });
    });

    socketInstance.on('overtime:newRequest', (data) => {
      toast(`🔔 New overtime request from ${data.employeeName} for ${data.requestedHours}h on ${data.date}`, {
        duration: 5000,
      });
    });

    socketInstance.on('attendance:punchIn', (data) => {
      if (user.role === 'admin' || user.role === 'manager') {
        toast(`📍 ${data.name} punched in`, { duration: 3000 });
      }
    });

    return () => {
      socketInstance?.off('overtime:reviewed');
      socketInstance?.off('attendance:validated');
      socketInstance?.off('overtime:newRequest');
      socketInstance?.off('attendance:punchIn');
    };
  }, [user, token]);

  return socketRef.current;
};

export default useSocket;
