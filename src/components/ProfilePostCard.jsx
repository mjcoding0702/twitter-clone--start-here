import { useContext, useState } from "react";
import { Button, Col, Image, Row } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { AuthContext } from "./AuthProvider";
import { likePost, removeLikeFromPost } from "../features/posts/postsSlice";

export default function ProfilePostCard({ post }) {
  const [likes, setLikes] = useState([]);
  const { content, id: postId } = post;
  const dispatch = useDispatch();
  const { currentUser } = useContext(AuthContext);
  const userId = currentUser.uid;

  //Determine whether the post is liked by the user or not
  const isLiked = likes.includes(userId)

  const pic = "https://pbs.twimg.com/profile_images/1587405892437221376/h167Jlb2_400x400.jpg";

  //Determine which function to run, depending on whether user has liked the post
  const handleLike = () => (isLiked? removeFromLikes() : addToLikes());

  //add userID to likes array
  const addToLikes = () => {
   setLikes([...likes, userId]);
   dispatch(likePost({ userId, postId }))
  }

  const removeFromLikes = () => {
    setLikes(likes.filter((id) => id !== userId));
    dispatch(removeLikeFromPost({ userId, postId}))
};

  return (
    <Row 
      className="p-3" 
      style={{ 
        borderTop: "1px solid #D3D3D3", 
        borderBottom: "1px solid #D3D3D3" 
      }}
    >
      <Col sm={1}>
        <Image src={pic} fluid roundedCircle />
      </Col>

      <Col>
        <strong>Haris</strong>
        <span> @haris.samingan · Apr 16</span>
        <p>{content}</p>
        <div className="d-flex justify-content-between">
          <Button variant="light">
            <i className="bi bi-chat"></i>
          </Button>
          <Button variant="light">
            <i className="bi bi-repeat"></i>
          </Button>
          <Button variant="light" onClick={handleLike}>
            {isLiked ? (
              <i className="bi bi-heart-fill text-danger"></i>
            ) : (
              <i className="bi bi-heart"></i>
            )}
            {likes.length}
          </Button>
          <Button variant="light">
            <i className="bi bi-graph-up"></i>
          </Button>
          <Button variant="light">
            <i className="bi bi-upload"></i>
          </Button>
        </div>
      </Col>
    </Row>
  )
}

