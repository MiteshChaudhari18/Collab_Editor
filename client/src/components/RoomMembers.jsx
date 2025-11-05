import { useEffect, useState } from 'react';
import { roomsAPI } from '../api';

const RoomMembers = ({ roomId, currentUserEmail }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roomId) {
      fetchMembers();
    }
  }, [roomId]);

  const fetchMembers = async () => {
    try {
      const res = await roomsAPI.getMembers(roomId);
      setMembers(res.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p className="text-sm">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-700">
      <h4 className="text-sm font-semibold text-white mb-3">Room Members</h4>
      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-xs text-gray-500">No members yet</p>
        ) : (
          members.map((member, index) => {
            const name = member.user?.name || member.email || 'Guest';
            const isCurrentUser = member.email === currentUserEmail;
            
            return (
              <div
                key={member._id || index}
                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 transition"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    backgroundColor: member.user?.color || '#6366f1'
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-white truncate">
                      {name}
                      {isCurrentUser && ' (You)'}
                    </span>
                    {member.role === 'admin' && (
                      <span className="bg-yellow-600 text-white text-xs px-1.5 py-0.5 rounded">
                        👑
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RoomMembers;

