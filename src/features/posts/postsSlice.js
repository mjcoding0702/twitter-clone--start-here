import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, storage } from "../../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

//Async thunk to delete post
export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async ({ userId, postId }) => {
    try {
      // Reference to the post
      const postRef = doc(db, `users/${userId}/posts/${postId}`);
      // Delete the post
      await deleteDoc(postRef);
      // Return the ID of the deleted post
      return postId;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

//Async thunk to update post
export const updatePost = createAsyncThunk(
  "posts/updatePost",
  async ({ userId, postId, newPostContent, newFile }) => {
    try {
      // Upload new file to the storage if it exists and get its URL
      let newImageUrl;
      if (newFile) {
        const imageRef = ref(storage, `posts/${newFile.name}`);
        const response = await uploadBytes(imageRef, newFile);
        newImageUrl = await getDownloadURL(response.ref);
      }
      // Reference to the existing post
      const postRef = doc(db, `users/${userId}/posts/${postId}`);
      // Get the current post data
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        // Update the post content and the image URL
        const updatedData = {
          ...postData,
          content: newPostContent || postData.content,
          imageUrl: newImageUrl || postData.imageUrl,
        };
        // Update the existing document in Firestore
        await updateDoc(postRef, updatedData);
        // Return the post with updated data
        const updatedPost = { id: postId, ...updatedData };
        return updatedPost;
      } else {
        throw new Error("Post does not exist");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

// Async thunk for fetching a user's posts
export const fetchPostsByUser = createAsyncThunk(
  "posts/fetchPostsByUser", // name
  async (userId) => {
    try {
      // get from firestore
      const postsRef = collection(db, `users/${userId}/posts`); //db = database from firestore

      const querySnapshot = await getDocs(postsRef);
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return docs; //output 'docs' to action.payload
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

// Async thunk to create a post
export const savePost = createAsyncThunk(
  "posts/savePost",
  async ({ userId, postContent, file }) => {
    try {
      let imageUrl = "";
      console.log(file);
      if (file !== null) {
        const imageRef = ref(storage, `posts/${file.name}`);
        const response = await uploadBytes(imageRef, file);
        imageUrl = await getDownloadURL(response.ref);
      }

      const postsRef = collection(db, `users/${userId}/posts`);
      const newPostRef = doc(postsRef);
      await setDoc(newPostRef, { content: postContent, likes: [], imageUrl });
      const newPost = await getDoc(newPostRef);

      const post = {
        id: newPost.id,
        ...newPost.data(),
      };

      return post;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

//Async thunk to like post
export const likePost = createAsyncThunk(
  "posts/likePost",
  async ({ userId, postId }) => {
    try {
      const postRef = doc(db, `users/${userId}/posts/${postId}`);

      const docSnap = await getDoc(postRef);

      if (docSnap.exists()) {
        const postData = docSnap.data();
        const likes = [...postData.likes, userId];
        // userId = 'JERE1'
        // postData.likes = [ 'JS1', 'MJ1' ]
        // likes = [ 'JS1', 'MJ1', 'JERE1' ]

        await setDoc(postRef, { ...postData, likes });
      }
      return { userId, postId };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

//Async thunk to remove like from post
export const removeLikeFromPost = createAsyncThunk(
  "posts/removeLikeFromPost",
  async ({ userId, postId }) => {
    try {
      const postRef = doc(db, `users/${userId}/posts/${postId}`);

      const docSnap = await getDoc(postRef);

      if (docSnap.exists()) {
        const postData = docSnap.data();
        const likes = postData.likes.filter((id) => id !== userId);

        await setDoc(postRef, { ...postData, likes });
      }
      return { userId, postId };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

// Slice
const postsSlice = createSlice({
  name: "posts",
  initialState: { posts: [], loading: true },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPostsByUser.fulfilled, (state, action) => {
        state.posts = action.payload;
        state.loading = false;
      })
      .addCase(savePost.fulfilled, (state, action) => {
        state.posts = [action.payload, ...state.posts];
      })
      .addCase(likePost.fulfilled, (state, action) => {
        const { userId, postId } = action.payload;

        const postIndex = state.posts.findIndex((post) => post.id === postId);

        if (postIndex !== -1) {
          state.posts[postIndex].likes.push(userId);
        }
      })
      .addCase(removeLikeFromPost.fulfilled, (state, action) => {
        const { userId, postId } = action.payload;

        const postIndex = state.posts.findIndex((post) => post.id === postId);

        if (postIndex !== -1) {
          state.posts[postIndex].likes = state.posts[postIndex].likes.filter(
            (id) => id !== userId
          );
        }
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        //Find and update the post in the state
        const postIndex = state.posts.findIndex(
          (post) => post.id === updatedPost.id
        );
        if (postIndex !== -1) {
          state.posts[postIndex] = updatedPost;
        }
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        const deletedPostId = action.payload;
        // Filter out the deleted post from state
        state.posts = state.posts.filter((post) => post.id !== deletedPostId);
      });
  },
});

export default postsSlice.reducer;
