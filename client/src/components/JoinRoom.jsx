import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invitesAPI } from '../api';

const JoinRoom = ({ user, onLogin }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState(null);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const res = await invitesAPI.getByToken(token);
      setInviteData(res.data.invite);
      
      // Accept invite and join the room
      if (res.data.invite?.room?._id) {
        try {
          // Accept the invite (adds user as member)
          await invitesAPI.accept(token);
          // Navigate to room
          navigate(`/room/${res.data.invite.room._id}`);
        } catch (acceptError) {
          // Even if accept fails, still try to join
          console.error('Error accepting invite:', acceptError);
          navigate(`/room/${res.data.invite.room._id}`);
        }
      } else {
        setError('Room not found');
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired invitation');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">You've been invited!</h2>
          <p className="text-gray-600">
            <strong>{inviteData?.invitedBy?.name}</strong> has invited you to join:
          </p>
          <p className="text-xl font-semibold text-primary-600 mt-2">
            {inviteData?.room?.name}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={async () => {
              if (inviteData?.room?._id) {
                try {
                  await invitesAPI.accept(token);
                  navigate(`/room/${inviteData.room._id}`);
                } catch (error) {
                  // Still navigate even if accept fails
                  navigate(`/room/${inviteData.room._id}`);
                }
              }
            }}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition"
          >
            Join Room
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Click the button above to join the room.
        </p>
      </div>
    </div>
  );
};

export default JoinRoom;

