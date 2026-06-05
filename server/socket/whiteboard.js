module.exports = (io, supabase) => {
  const rooms = {};
  
  io.on('connection', (socket) => {
    console.log('🎨 User connected:', socket.id);
    
    // Присоединение к комнате
    socket.on('join-whiteboard', (data) => {
      socket.join(data.roomId);
      socket.roomId = data.roomId;
      socket.userName = data.userName;
      socket.userColor = data.userColor;
      
      if (!rooms[data.roomId]) {
        rooms[data.roomId] = { users: [], objects: [], stickers: [] };
      }
      
      rooms[data.roomId].users.push({
        id: socket.id,
        name: data.userName,
        color: data.userColor
      });
      
      // Отправляем текущее состояние доски новому пользователю
      socket.emit('board-updated', {
        objects: rooms[data.roomId].objects,
        stickers: rooms[data.roomId].stickers
      });
      
      // Уведомляем всех о новом пользователе
      io.to(data.roomId).emit('user-joined', {
        count: rooms[data.roomId].users.length,
        users: rooms[data.roomId].users
      });
    });
    
    // Данные рисования
    socket.on('draw', (data) => {
      socket.to(data.roomId).emit('draw-data', data);
      
      // Сохраняем объекты
      if (data.type === 'object-added') {
        rooms[data.roomId]?.objects.push(data.data);
      }
    });
    
    // Позиция курсора
    socket.on('cursor', (data) => {
      socket.to(data.roomId).emit('cursor-move', {
        ...data,
        userId: socket.id
      });
    });
    
    // Сохранение доски
    socket.on('save-board', async (data) => {
      try {
        await supabase.from('whiteboards').upsert({
          room_id: data.roomId,
          objects: data.data.objects || [],
          stickers: data.data.stickers || [],
          updated_at: new Date().toISOString()
        });
        console.log('✅ Доска сохранена');
      } catch(e) {
        console.error('Ошибка сохранения:', e);
      }
    });
    
    // Загрузка доски
    socket.on('load-board', async (data) => {
      try {
        const { data: board } = await supabase.from('whiteboards').select('*').eq('room_id', data.roomId).single();
        if (board) {
          socket.emit('board-updated', {
            objects: board.objects,
            stickers: board.stickers
          });
        }
      } catch(e) {}
    });
    
    // Отключение
    socket.on('disconnect', () => {
      if (socket.roomId && rooms[socket.roomId]) {
        rooms[socket.roomId].users = rooms[socket.roomId].users.filter(u => u.id !== socket.id);
        io.to(socket.roomId).emit('user-left', {
          count: rooms[socket.roomId].users.length,
          userId: socket.id
        });
      }
      console.log('🎨 User disconnected:', socket.id);
    });
  });
};
