import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, getAllUsers, updateUserRole, getUserProfile } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Check authentication and admin status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        navigate('/login');
      } else {
        // Check if user is admin
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
          setIsAdmin(profile?.role === 'admin');
          
          if (profile?.role !== 'admin') {
            // If not admin, redirect to home
            alert('You do not have admin privileges to access this page');
            navigate('/');
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  // Load users data
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !isAdmin) return;
      
      try {
        setLoading(true);
        const allUsers = await getAllUsers();
        setUsers(allUsers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users");
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [user, isAdmin]);
  
  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      
      // Update the local state to reflect the change
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole } 
          : user
      ));
      
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded shadow text-center">
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded shadow text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Users List</h1>
      
      {users.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Username</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Email</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Role</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Created</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((userData) => (
                <tr key={userData.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{userData.username}</td>
                  <td className="py-3 px-4">{userData.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      userData.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userData.role || 'user'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    {userData.id !== user.uid && (
                      <select 
                        className="p-1 border rounded text-sm bg-white"
                        value={userData.role || 'user'}
                        onChange={(e) => handleRoleChange(userData.id, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    {userData.id === user.uid && (
                      <span className="text-sm text-gray-500">Current User</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersList;