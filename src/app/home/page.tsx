/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { jwtDecode } from "jwt-decode";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"; // Importing the Carousel component

type LikeTypes = {
  profileImage: string;
  username: string;
  _id: string | null;
};

type PostType = {
  _id: string;
  caption: string;
  content: string[]; // Changed to an array for multiple images
  userId: string;
  createdAt: string;
  likes: LikeTypes[];
}[];

const Page = () => {
  const [posts, setPosts] = useState<PostType>([]);
  const [images, setImages] = useState<File[]>([]); // Changed to File[] to accumulate multiple files
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const token = localStorage.getItem("token");
  let decodedUserId: string | null = null;
  let currentUserProfileImage: string = "";
  let currentUsername: string = "";

  if (token) {
    const decodedToken = jwtDecode<{
      id: string;
      username: string;
      profileImage: string;
    }>(token);
    decodedUserId = decodedToken.id;
    currentUserProfileImage = decodedToken.profileImage;
    currentUsername = decodedToken.username;
  }

  useEffect(() => {
    const getPosts = async () => {
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch(
        `https://instagram-backend-hb8j.onrender.com/posts/getAllPosts`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = await response.json();
      if (response.ok) {
        setPosts(responseData);
      } else {
        console.error("Failed to fetch posts:", responseData.message);
      }
    };

    getPosts();
  }, []);

  const uploadImages = async () => {
    if (!images.length) return;

    const uploadPromises = images.map(async (image) => {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", "instagrampics");
      formData.append("cloud_name", "dd3esfmam");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dd3esfmam/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const result = await response.json();
      return result.secure_url; // Return the image URL
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    setUploadedImages(uploadedUrls.filter((url) => url !== null) as string[]);
  };

  const createPost = async () => {
    if (!uploadedImages.length || !decodedUserId) return;

    const postData = {
      content: uploadedImages, // Array of image URLs
      author: decodedUserId, // User ID from token
    };

    try {
      const response = await fetch(
        "https://instagram-backend-hb8j.onrender.com/posts/createPost",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(postData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const newPost = await response.json();
      setPosts((prevPosts) => [newPost.post, ...prevPosts]); // Add the new post to the state
      setUploadedImages([]); // Reset uploaded images

      // Automatically like the newly created post
      likePost(newPost.post._id);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const likePost = async (postId: string) => {
    const userId = decodedUserId;
    try {
      const response = await fetch(
        "https://instagram-backend-hb8j.onrender.com/posts/like",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId, userId }),
        }
      );
      const responseData = await response.json();
      if (response.ok) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likes: [
                    ...post.likes,
                    {
                      username: responseData.user.username,
                      profileImage: responseData.user.profileImage,
                      _id: userId,
                    },
                  ],
                }
              : post
          )
        );
      } else {
        console.error("Error: Response not OK", responseData);
      }
    } catch (error) {
      console.error("error2", error);
    }
  };

  const unlikePost = async (postId: string) => {
    try {
      const response = await fetch(
        "https://instagram-backend-hb8j.onrender.com/posts/unlike",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId, userId: decodedUserId }),
        }
      );
      const responseData = await response.json();
      if (response.ok) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likes: post.likes.filter((like) => like._id !== decodedUserId),
                }
              : post
          )
        );
      } else {
        console.error("Error unliking post:", responseData.message);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleLike = (post: PostType[number]) => {
    if (decodedUserId && post.likes.some((like) => like._id === decodedUserId)) {
      unlikePost(post._id);
    } else {
      likePost(post._id);
    }
  };

  const Userprofile = () => {
    window.location.href = "/userprofile";
  };

  // Remove selected file from images list
  const removeFile = (fileToRemove: File) => {
    setImages((prevImages) => prevImages.filter((file) => file !== fileToRemove));
  };

  return (
    <div
      style={{
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <input
        type="file"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files) {
            setImages((prevImages) => [
              ...prevImages,
              ...Array.from(files),
            ]); // Append selected files to previous images
            uploadImages(); // Upload images once selected
          }
        }}
        className="file:border file:border-gray-300 file:rounded-md file:px-4 file:py-2 file:bg-blue-50 file:text-blue-700 file:cursor-pointer hover:file:bg-blue-100"
      />

      {/* Displaying selected files with remove option */}
      <div className="mt-4 text-center">
        {images.map((file, index) => (
          <div
            key={index}
            style={{
              marginBottom: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{file.name}</span>
            <button
              onClick={() => removeFile(file)}
              style={{ color: "red", cursor: "pointer" }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Displaying uploaded images */}
      <div className="mt-4 text-center">
        {uploadedImages.map((img, index) => (
          <img
            key={index}
            src={img}
            className="max-w-full h-[300px] rounded-lg shadow-lg"
          />
        ))}
      </div>

      <Button onClick={createPost} disabled={uploadedImages.length === 0}>
        Create Post
      </Button>

      {/* Displaying posts */}
      {posts?.map((post) => (
        <Card
        key={post._id}
        style={{
          border: "1px solid #ddd",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          overflow: "hidden",
          width: "100%",
          maxWidth: "600px",
          margin: "1rem 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
              justifyContent: "space-between",
            }}
          >
            {post.likes && post.likes.length > 0 && (
              <div
                key={post.likes[0]._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <img
                  src={post.likes[0].profileImage}
                  alt={post.likes[0].username}
                  style={{
                    width: "35px",
                    height: "33px",
                    borderRadius: "50%",
                    border: "1px solid #ddd",
                  }}
                />
                <p style={{ fontSize: "0.875rem" }}>{post.likes[0].username}</p>
                <p style={{ fontSize: "0.75rem", color: "#999" }}>
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            )}
            <Button
              style={{
                marginLeft: "auto",
                color: "black",
                backgroundColor: "white",
              }}
            >
              ...
            </Button>
          </div>
      
          {/* Render the carousel or single image */}
          {post.content.length > 1 ? (
            // If the post has more than one image, show the images in a carousel
            <Carousel style={{ marginBottom: "1rem" }}>
              <CarouselPrevious />
              <CarouselContent>
                {post.content.map((imageUrl, idx) => (
                  <CarouselItem key={idx}>
                    <img
                      src={imageUrl}
                      alt={`Post Image ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: "auto",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselNext />
            </Carousel>
          ) : (
            // If the post only has one image, display it normally
            <img
              src={post.content[0]}
              alt={`Post Image 1`}
              style={{
                width: "100%",
                height: "auto",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "1rem", // Added margin for spacing
              }}
            />
          )}
      
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Button
              style={{
                color: "black",
                backgroundColor: "white",
              }}
              onClick={() => toggleLike(post)}
            >
              {decodedUserId &&
              post.likes.some((like) => like._id === decodedUserId)
                ? "❤️"
                : "🤍"}{" "}
              {post.likes.length}
            </Button>
            <Button style={{ backgroundColor: "white" }}>
              <img
                style={{ height: "15px" }}
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlHV1tLj4KUZ_DW5KLcipQMT7zu_w3RlT4fw&s"
                alt="comment"
              />
            </Button>
            <Button style={{ backgroundColor: "white" }}>
              <img
                style={{ height: "15px" }}
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2NvjEnm9lfNXVU4oBqr-xkcu6Lm_-7cjftNggaC7vXwQFUedVu1BeSRotNrRMpqFZZ_Q&usqp=CAU"
                alt="share"
              />
            </Button>
          </div>
        </div>
      </Card>
      
      ))}

      <div className="sticky-footer">
        <img
          src="https://images.vexels.com/media/users/3/147094/isolated/preview/055a10de0c31e98eef1451f742c32345-instagram-home-icon.png"
          alt="Home"
        />
        <img
          src="https://cdn-icons-png.flaticon.com/512/159/159690.png"
          alt="Profile"
        />
        <div onClick={Userprofile} className="user-profile">
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

export default Page;
