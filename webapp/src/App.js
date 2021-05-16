import "./App.css";
import { fade, makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import InputBase from "@material-ui/core/InputBase";
import SearchIcon from "@material-ui/icons/Search";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { useState, useEffect } from "react";

const matchers = [/^(\d+)$/, /https:\/\/[\w\.]+\.dcard.tw\/f\/[\w]+\/p\/(\d+)/];

const apiUrl =
  "https://us-central1-dcard-author-only-viewer.cloudfunctions.net/getAllAuthorCommentsByPost";

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "block",
    },
  },
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(3),
      width: "auto",
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRoot: {
    color: "inherit",
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
  sectionDesktop: {
    display: "none",
    [theme.breakpoints.up("md")]: {
      display: "flex",
    },
  },
  sectionMobile: {
    display: "flex",
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
}));

function App() {
  const classes = useStyles();
  const [comments, setComments] = useState([]);
  const [isError, setIsError] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const handleSearchInputOnChange = (event) => {
    setSearchInput(event.target.value);
  };
  useEffect(() => {
    (async () => {
      // validate input
      let postId = null;
      for (const mat of matchers) {
        const m = mat.exec(searchInput);
        if (m === null) {
          continue;
        }
        postId = m[1];
      }
      if (postId === null) {
        // prevent fetching if error
        setIsError(true);
        return;
      }
      try {
        const searchRes = await window.fetch(apiUrl, {
          body: JSON.stringify({ searchInput }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          mode: "cors",
        });
        if (!searchRes.ok) {
          throw new Error(`api error: ${searchRes.status}`);
        }
        setComments(await searchRes.json());
      } catch (err) {
        console.log(err);
        setIsError(true);
        return;
      }

      setIsError(false);
    })();
  }, [searchInput]);
  return (
    <div className={classes.grow}>
      <AppBar position="static">
        <Toolbar>
          <Typography className={classes.title} variant="h6" noWrap>
            Dcard 作者留言閱讀器
          </Typography>
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              placeholder="文章編號/文章連結"
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ "aria-label": "search" }}
              onChange={handleSearchInputOnChange}
            />
          </div>
        </Toolbar>
      </AppBar>
      <div>
        {isError && searchInput !== "" ? (
          <List>
            <ListItem>
              <ListItemText
                primary="發生錯誤"
                secondary="檢測不到文章或發生錯誤，請檢查文章連結或編號是否正確。"
              />
            </ListItem>
          </List>
        ) : (
          <List>
            {comments.map((comment) => (
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={"B" + comment.floor}
                  secondary={comment.content}
                />
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </div>
  );
}

export default App;
