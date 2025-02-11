/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { jwtDecode } from 'jwt-decode';

// Type for the Like structure
type LikeType = {
  _id: string;
  username: string;
  profileImage: string;
};

// Type for the Post structure
type PostType = {
  _id: string;
  caption: string;
  content: string;
  userId: string;
  createdAt: string;
  likes: LikeType[];
};

const UserProfile = () => {
  const [posts, setPosts] = useState<PostType[]>([]); // Use PostType for state
  const [followersCount, setFollowersCount] = useState<number>(0); // Followers count state
  const [followingCount, setFollowingCount] = useState<number>(0); // Following count state
  const token = localStorage.getItem('token');
  let decodedUserId: string | null = null;
  let currentUserProfileImage: string = '';
  let currentUsername: string = '';
  let currentEmail: string = ''; // Store email from token
  let currentBio: string = ''; // Store bio if available

  // Decode token if it exists
  if (token) {
    const decodedToken = jwtDecode<{ id: string, username: string, profileImage: string, email: string, bio?: string }>(token);
    decodedUserId = decodedToken.id;
    currentUserProfileImage = decodedToken.profileImage;
    currentUsername = decodedToken.username;
    currentEmail = decodedToken.email;
    currentBio = decodedToken.bio || "No bio available"; // Default if no bio is provided
  }

  // Fetch user posts
  useEffect(() => {
    const getPosts = async () => {
      if (!decodedUserId || !token) {
        console.error('No token or userId found');
        return;
      }

      const response = await fetch(`https://instagram-backend-hb8j.onrender.com/posts/user/${decodedUserId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = await response.json();
      if (response.ok) {
        setPosts(responseData);
      } else {
        console.error("Failed to fetch posts:", responseData.message);
      }
    };

    // Fetch followers and following counts
    const getFollowStats = async () => {
      if (!decodedUserId || !token) {
        console.error('No token or userId found');
        return;
      }

      const response = await fetch(`https://instagram-backend-hb8j.onrender.com/users/${decodedUserId}/followStats`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setFollowersCount(data.followersCount);
        setFollowingCount(data.followingCount);
      } else {
        console.error("Failed to fetch follow stats:", data.message);
      }
    };

    getPosts();
    getFollowStats();
  }, [decodedUserId, token]);

  const likePost = async (postId: string) => {
    const userId = decodedUserId;
    try {
      const response = await fetch('https://instagram-backend-hb8j.onrender.com/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId }),
      });
      const responseData = await response.json();
      if (response.ok) {
        setPosts(prevPosts => prevPosts.map(post =>
          post._id === postId
            ? { ...post, likes: [...post.likes, responseData.user] }
            : post
        ));
      } else {
        console.error('Error: Response not OK', responseData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const unlikePost = async (postId: string) => {
    try {
      const response = await fetch('https://instagram-backend-hb8j.onrender.com/posts/unlike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: decodedUserId }),
      });
      const responseData = await response.json();
      if (response.ok) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? { ...post, likes: post.likes.filter(like => like._id !== decodedUserId) }
              : post
          )
        );
      } else {
        console.error('Error unliking post:', responseData.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleLike = (post: PostType) => {
    if (decodedUserId && post.likes.some(like => like._id === decodedUserId)) {
      unlikePost(post._id);
    } else {
      likePost(post._id);
    }
  };

  const handleHomeClick = () => {
    window.location.href = "/home";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Profile Info and Dashboard Tools (in one Card) */}
      <div className="w-full sm:w-[600px] mt-8">
        <Card className="shadow-lg rounded-lg p-4">
          <CardContent className="space-y-6">
            {/* Profile Info Section */}
            <div className="flex flex-row gap-12">
            <div className="flex items-center gap-4">
              <img
                src={currentUserProfileImage}
                alt={currentUsername}
                className="w-24 h-24 rounded-full border-4 border-gray-300"
              />
              <div className="flex flex-col text-center">
                <h2 className="text-xl font-semibold">{currentUsername}</h2>
                <p className="text-sm text-gray-600">{currentEmail}</p>
                <p className="text-sm text-gray-600 mt-2">{currentBio}</p>
              </div>
            </div>
            
            {/* Counts displayed on the right */}
            <div className="flex flex-row items-center justify-center gap-2 text-gray-600">
              <span className="font-semibold">{posts.length}</span>
              <span className="text-xs">Posts</span>
              <span className="font-semibold">{followersCount}</span>
              <span className="text-xs">Followers</span>
              <span className="font-semibold">{followingCount}</span>
              <span className="text-xs">Following</span>
            </div>
            </div>

            {/* Professional Dashboard Tools Section */}
            <div className="mt-6">
  <div className="flex justify-between gap-2">
    <Button variant="outline" className="bg-white text-black w-1/2">Edit Profile</Button>
    <Button variant="outline" className="bg-white text-black w-1/2">Share Profile</Button>
  </div>
</div>
          </CardContent>
        </Card>
      </div>

      {/* Display only user's posts */}
      <div className="w-full sm:w-[600px] mt-8">
        {posts.length > 0 ? (
          posts.map((post: PostType) => (
            <Card
              key={post._id}
              className="mb-4 shadow-lg rounded-lg overflow-hidden"
            >
              <CardContent>
                {/* Post Caption */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    {post.likes && post.likes.length > 0 && (
                      <img
                        src={post.likes[0].profileImage}
                        alt={post.likes[0].username}
                        className="w-10 h-10 rounded-full border border-gray-300"
                      />
                    )}
                    <p className="text-sm font-semibold">{post.likes[0]?.username}</p>
                  </div>
                  <Button
                    variant="outline"
                    style={{ backgroundColor: 'white', color: 'black' }}
                  >
                    ...
                  </Button>
                </div>

                {/* Post Image */}
                <img
                  src={post.content}
                  alt="Post Image"
                  className="w-full rounded-lg mb-4"
                />

                {/* Like Button */}
                <div className="flex gap-4 items-center">
                  <Button
                    variant="outline"
                    onClick={() => toggleLike(post)}
                    className="text-black bg-white"
                  >
                    {decodedUserId && post.likes.some(like => like._id === decodedUserId) ? '❤️' : '❤️'} {post.likes.length}
                  </Button>
                  <Button variant="outline" className="bg-white">
                    <img
                      className="w-4 h-4"
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlHV1tLj4KUZ_DW5KLcipQMT7zu_w3RlT4fw&s"
                      alt="comment"
                    />
                  </Button>
                  <Button variant="outline" className="bg-white">
                    <img
                      className="w-4 h-4"
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2NvjEnm9lfNXVU4oBqr-xkcu6Lm_-7cjftNggaC7vXwQFUedVu1BeSRotNrRMpqFZZ_Q&usqp=CAU"
                      alt="share"
                    />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-600">No posts available. Start sharing some photos!</p>
        )}
      </div>

      {/* Sticky footer with profile image and username */}
      <div className="sticky-footer">
        <img onClick={handleHomeClick} src="https://images.vexels.com/media/users/3/147094/isolated/preview/055a10de0c31e98eef1451f742c32345-instagram-home-icon.png" alt="Home" />
        <img src="https://cdn-icons-png.flaticon.com/512/159/159690.png" alt="Profile" />

        {/* User Profile Image and Username */}
        <div className="user-profile">
          <img
            src={currentUserProfileImage}
            alt={currentUsername}
            className="user-profile-image"
          />
          <p className="user-username">{currentUsername}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
