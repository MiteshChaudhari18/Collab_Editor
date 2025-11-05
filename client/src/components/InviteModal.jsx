import { useState } from 'react';
import { invitesAPI } from '../api';

const InviteModal = ({ roomId, roomName, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });
    setInviteLink('');

    try {
      const res = await invitesAPI.create({ roomId, email });
      const data = res.data;
      
      if (data.emailSent) {
        setMessage({ type: 'success', text: `Invitation sent to ${email}!` });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Email failed but invite was created
        setInviteLink(data.invite?.inviteLink || '');
        setMessage({
          type: 'warning',
          text: `Email failed to send (${data.emailError || 'configuration issue'}). Use the invite link below:`
        });
      }
      setEmail('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send invitation'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Invite Collaborator</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Invite someone to join <strong>{roomName}</strong>
        </p>

        {message.text && (
          <div
            className={`mb-4 px-4 py-3 rounded ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : message.type === 'warning'
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {inviteLink && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Link (copy this if email failed):
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
              />
              <button
                onClick={copyInviteLink}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition text-sm"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="collaborator@example.com"
              required
              autoFocus
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;

