"use client";
import { BottomNav } from "@/src/components/BottomNav";
import { useParams } from "next/navigation";
import Modal from "@/src/components/Modal";
import { useEffect, useState, useRef, useCallback, memo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Icon from "@/src/components/icons/location";
import Post from "@/src/components/post";
import { LazyImage } from "@/src/components/Image";
import Comment from "@/src/components/comment";
import { Loading } from "@/src/components/icons/loading";
import { api } from "@/src/api/api";
import { SideBarLeft, SideBarRight } from "@/src/components/Sidebars";
export default function User(props: {
  swapPage: Function;
  setParams: Function;
  params: any;
  setLastPage: Function;
  lastPage: any;
  page: string;
}) {
  if (typeof window !== "undefined" && props.params.user === undefined) {
    api
      .list({
        collection: "users",
        cacheKey: `user-${props.params.username}`,
        limit: 1,
        page: 0,
        filter: `username="${props.params.username}"`,
      })
      .then((e: any) => {
        props.setParams({ user: e.items[0] });
      });
  }
  let [followers, setFollowers] = useState<any>(
    typeof window !== "undefined" ? props.params.user?.followers : []
  );
  let [user, setUser] = useState<any>(
    typeof window !== "undefined" ? props.params.user : {}
  );
  let [banner, setBanner] = useState<any>(
    typeof window !== "undefined" ? props.params.user?.banner : ""
  );
  let [page, setPage] = useState(1);
  let [array, setArray] = useState<any>([]);
  let [comments, setComments] = useState<any>([]);
  let [totalPages, setTotalPages] = useState(1);
  let [totalItems, setTotalItems] = useState(0);
  let [hasMore, setHasMore] = useState(true);
  let [feedPage, setFeedPage] = useState("posts");
  let [avatar, setAvatar] = useState<any>(null);
  let [bannerBlob, setBannerBlob] = useState<any>(null);
  let [bannerFile, setBannerFile] = useState<any>(null);
  let [windowScroll, setWindowScroll] = useState(0);
  let [online, setOnline] = useState<any>(false);
  let [saving, setSaving] = useState<any>(false);
  let isMounted = useRef(false);

  // todo: make an event to update automatically
  useEffect(() => {
    api.online.forEach((e: any) => {
      if (e?.userID == props.params?.user.id && !isMounted.current) {
        isMounted.current = true;
      }
    });
  }, [props.params?.user.id]);

  typeof window != "undefined" &&
    window.addEventListener("online", () => {
      api.online.forEach((e: any) => {
        if (e?.userID == props.params?.user.id) {
          if (!online) {
            setOnline(true);
          }
        }
      });
    });

  let [isFetching, setIsFetching] = useState(true);
  let maxBioLength = 160;
  let bannerRef = useRef<any>(null);
  let avatarRef = useRef<any>(null);
  typeof window !== "undefined"
    ? (document.title = `${props.params.user?.username} (@${props.params.user?.username}) / Postr`)
    : null;

  if (typeof window == "undefined") return null;
  let isIntialized = useRef(false);
  typeof window !== "undefined"
    ? (window.onscroll = () => {
        setWindowScroll(window.scrollY);
      })
    : null;

  function parseDate(date: string) {
    let now = new Date();
    let diff = now.getTime() - new Date(date).getTime();
    let seconds = diff / 1000;
    let minutes = seconds / 60;
    let hours = minutes / 60;
    let days = hours / 24;
    let weeks = days / 7;
    let months = weeks / 4;
    let years = months / 12;
    switch (true) {
      case seconds < 60:
        return `${Math.floor(seconds)}s`;
        break;
      case minutes < 60:
        return `${Math.floor(minutes)}m`;
        break;
      case hours < 24:
        return `${Math.floor(hours)}h`;
        break;
      case days < 7:
        return `${Math.floor(days)}d`;
        break;
      case weeks < 4:
        return `${Math.floor(weeks)}w`;
        break;
      case months < 12:
        return `${Math.floor(months)}mo`;
        break;
      case years >= 1:
        return `${Math.floor(years)}y`;
        break;
      default:
        break;
    }
  }

  
  function updatePostCache(id: string, record: any) {
    for (var i in api.cacehStore.keys()) {
      if (api.cacehStore.keys()[i].includes(`posts`)) {
        let cache = JSON.parse(api.cacehStore.get(api.cacehStore.keys()[i]));
        cache.value.items.map((e: any, index: number) => {
          if (e.expand.author && e.expand.author.id === id) {
            e.expand.author = record;
            cache.value.items[index].expand.author = record;

            api.cacehStore.set(api.cacehStore.keys()[i], cache.value, 1200);
          }
        });
      }
    }
  }

  function follow() {
    switch (true) {
      case followers.includes(api.authStore.model().id):
        setFollowers(
          followers.filter((u: any) => u != api.authStore.model().id)
        );
        updatePostCache(props.params.user.id, {
          ...props.params.user,
          followers: followers.filter(
            (u: any) => u != api.authStore.model().id
          ),
        });
        api
          .update({
            collection: "users",
            id: props.params.user.id,
            cacheKey: `user-${props.params.user.id}`,

            record: {
              followers: followers.filter(
                (u: any) => u != api.authStore.model().id
              ),
            },
          })
          .then((e: any) => {
            let updatedFollowing = api.authStore
              .model()
              .following.filter((id: any) => id != props.params.user.id);
            api
              .update({
                collection: "users",
                cacheKey: `user-${api.authStore.model().id}`,
                expand: [],
                id: api.authStore.model().id,
                record: { following: updatedFollowing },
              })
              .then((e: any) => {
                api.authStore.update();
              });
          });

        break;

      default:
        setFollowers([...followers, api.authStore.model().id]);
        updatePostCache(props.params.user.id, {
          ...props.params.user,
          followers: [...props.params.user.followers, api.authStore.model().id],
        });
        api
          .update({
            collection: "users",
            id: props.params.user.id,
            cacheKey: `user-${props.params.user.id}`,
            record: {
              followers: [...user.followers, api.authStore.model().id],
            },
          })
          .then((e: any) => {
            api
              .update({
                collection: "users",
                id: api.authStore.model().id,
                record: {
                  following: [
                    ...api.authStore.model().following,
                    props.params.user.id,
                  ],
                },
              })
              .then((e: any) => {
                api.authStore.update();
              });
          });

        break;
    }
  }

  useEffect(() => {
    if (isIntialized.current && isFetching) {
      isIntialized.current = true;
      return;
    }
    if(props.params.scrollTo){
      // check when the element or if the element is in dom then scroll to it
      const check = setInterval(() => {
        let element = document.getElementById(props.params.scrollTo)
        if(element){
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.className =  `xl:mt-0 w-full    xl:p-3  xl:mb-0 mb-6   ${
            props.page !== "user" &&
            props.page !== "bookmarks" &&
            props.page !== "home"
              ? "xl:p-5 sm:p-2"
              : props.page == "home"
              ? "xl:p-5  "
              : ""
          }
          animate-pulse
          `
          setTimeout(() => {
            //@ts-ignore
            element.className = `xl:mt-0 w-full    xl:p-3  xl:mb-0 mb-6   ${
              props.page !== "user" &&
              props.page !== "bookmarks" &&
              props.page !== "home"
                ? "xl:p-5 sm:p-2"
                : props.page == "home"
                ? "xl:p-5  "
                : ""
            }`
          }, 4000);
          clearInterval(check)
        }
      }, 1000);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (api.cacehStore.get(`user-feed-posts-${1}-${user.id}`)) {
      let cache = JSON.parse(
        api.cacehStore.get(`user-feed-posts-${1}-${user.id}`)
      );
      setArray(cache.value.items);
      setTotalPages(cache.value.totalPages);
      setTotalItems(cache.value.totalItems);
      setTimeout(() => {
        setIsFetching(false);
        `1QS`;
      }, 500);
      setHasMore(true);
      return;
    } else {
      api
        .list({
          collection: "posts",
          limit: 10,
          filter: `author.id ="${props.params.user.id}"`,
          expand: [
            "author",
            "comments.user",
            "user",
            "post",
            "post.author",
            "author.followers",
            "author.following",
            "author.following.followers",
            "author.following.following",
          ],
          page: 1,
          sort: `-pinned, -created`,
        })
        .then((e: any) => {
          if(feedPage === "posts"){
             // sort by pinned
              e.items = e.items.sort((a:any,b:any)=>{
                return b.pinned - a.pinned
              })
          } 
          setArray(e.items);
          setTotalPages(e.totalPages);
          setTotalItems(e.totalItems);
          setHasMore(true);
          setIsFetching(false);
          api.cacehStore.set(
            `user-feed-posts-${1}-${user.id}`,
            {
              items: e.items,
              totalItems: e.totalItems,
              totalPages: e.totalPages,
            },
            230
          );
        });
    }

    return () => {
      isIntialized.current = false;
    };
  }, [props.params.user]);

  const swapPage = useCallback((page: string) => {
    setFeedPage(page);
     if(page === "collections"){
       
      return
     }
   
    setPage(1);
    swapFeed(page);
  }, []);

  function swapFeed(pageValue: string, pg: number = 0) {
    setIsFetching(true);
    if (api.cacehStore.has(`user-feed-${pageValue}-${pg}-${user.id}`)) {
      let cache = JSON.parse(
        api.cacehStore.get(`user-feed-${pageValue}-${pg}-${user.id}`)
      );
      setArray(cache.value.items);
      setTotalPages(cache.value.totalPages);
      setTotalItems(cache.value.totalItems);
      setHasMore(true);
      return;
    } 

    let filterString =
      pageValue === "posts"
        ? `author.id ="${user.id}"`
        : pageValue === "likes"
        ? `likes~"${user.id}" && author.id != "${user.id}"`
        
        : pageValue === "media"
        ? `author.id ="${user.id}" && file:length > 0  `
        : "";

    let collection =
      pageValue === "posts" || pageValue === "likes"
        ? "posts"
      
        : pageValue === "media"
        ? "posts"
        : "";
    setPage(1);
    setArray([]);
    setIsFetching(true);
    api
      .list({
        collection: collection,
        limit: 10,
        filter: filterString,
        cacheKey: `user-feed-${pageValue}-${pg}-${user.id}`,
        expand: [
          "author",
          "comments.user",
          "user",
          "post",
          "post.author",
          "author.followers",
          "author.following",
          "author.following.followers",
          "author.following.following",
        ],
        page: 0,
        sort:   pageValue !== "posts" ? `-created` : `-pinned, -created`,
      })
      .then((e: any) => {
        if (!api.cacehStore.has(`user-feed-${pageValue}-${page}-${user.id}`)) {
          api.cacehStore.set(
            `user-feed-${pageValue}-${page}-${user.id}`,
            {
              items: e.items,
              totalItems: e.totalItems,
              totalPages: e.totalPages,
            },
            1200
          );
        }

        setArray(e.items);
        setTotalPages(e.totalPages);
        setTotalItems(e.totalItems);
        setHasMore(true);
        setTimeout(
          () => {
            setIsFetching(false);
          },
          feedPage === "media" ? 1200 : 500
        );
      });
  }

  function loadMore() {
    switch (true) {
      case page >= totalPages:
        console.log("no more");
        setHasMore(false);
        return;
      case api.cacehStore.has(`user-feed-${feedPage}-${page + 1}-${user.id}`):
        return;
      default:
        if(feedPage === "collections"){
          return
        } 
        api
          .list({
            collection:
              feedPage === "posts"
                ? "posts"
                : feedPage === "likes"
                ? "posts"
                : feedPage === "replies"
                ? "comments"
                : feedPage === "media"
                ? "posts"
                : "",
            limit: 10,
            filter:
              feedPage === "posts"
                ? `author.id ="${user.id}"`
                : feedPage === "likes"
                ? `likes?~"${user.id}" && author.id != "${user.id}"`
                : feedPage === "replies"
                ? `user.id="${user.id}" &&post.author.id!="${user.id}"`
                : feedPage === "media"
                ? `file:length > 0  && author.id ="${user.id}"`
                : "",
            expand: [
              "author",
              "comments.user",
              "user",
              "post",
              "post.author",
              "author.followers",
              "author.following",
              "author.following.followers",
              "author.following.following",
            ],
            sort: `-created`,
            page: page + 1,
          })
          .then((e: any) => {
            if (feedPage === "media") {
              e.items = e.items.filter((e: any) => e.file.length > 0);
            }
            setArray([...array, ...e.items]);
            setTotalPages(e.totalPages);
            setTotalItems(e.totalItems);
            setHasMore(true);
            setPage(page + 1);
            api.cacehStore.set(
              `user-feed-${feedPage}-${page + 1}-${user.id}`,
              {
                items: e.items,
                totalItems: e.totalItems,
                totalPages: e.totalPages,
              },
             1200
            );
          });
        break;
    }
  }
  async function save() {
    let userObj: any = {};
    console.log(user);
    let linkreg = /(?:https):\/\/[\n\S]+/g;
    switch (true) {
      case user.username !== props.params.user.username && user.username.length < 3:
        console.log("username too short");
      case user.username !== props.params.user.username:
        try {
          let res = await api.checkUsername(user.username);

          if (res) {
            alert("Username already exists.");
            return;
          }
        } catch (error) {
          console.log(error);
        }
        break;
      case user.bio !== props.params.user.bio && user.bio.length < 3:
        console.log("bio too short");
      case  user.social !== props.params.user.social &&  user.social.match(linkreg) == null:
        return alert("Invalid link");
        return;
      default: 
        break;
    } 

    user.username !== props.params.user.username
      ? (userObj.username = user.username)
      : "";
    user.bio !== props.params.user.bio ? (userObj.bio = user.bio) : "";
    user.location !== props.params.user.location
      ? (userObj.location = user.location)
      : "";
    user.social !== props.params.user.social
      ? (userObj.social = user.social)
      : "";
    bannerBlob !== null
      ? (userObj.banner = {
          isFile: true,
          update: true,
          file: {
            data:await api.getAsByteArray(bannerBlob),
            size: bannerFile.size,
            name: bannerFile.name,
            type:  bannerFile.type,
          }
        })
      : "";
    avatar !== null
      ? (userObj.avatar = {
          isFile: true,
          update: true,
          file: {
            data: await api.getAsByteArray(avatar),
            size: avatar.size,
            name: avatar.name,
            type: avatar.type,
          },
          name: avatar.name,
          type: avatar.type,
        })
      : "";

     
    try {
      if (Object.keys(userObj).length > 0) {
        setSaving(true);
        let res: any = await api.update({
          collection: "users",
          id: props.params.user.id,
          record: userObj,
          expand: ["followers", "following", "following.followers"]
        });
        api.authStore.update();
        setAvatar(null);
        setBannerBlob(null);
        setBannerFile(null); 
        setUser(res);
        setBanner(res.banner);
   
        setSaving(false);
      }
      //@ts-ignore
      if (typeof window !== "undefined")
        //@ts-ignore
        document.getElementById("edit-modal")?.close();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div
      key={props.params.user.id}
      className=" relative xl:flex   lg:flex   xl:w-[80vw]   justify-center xl:mx-auto"
    >
      <SideBarLeft
        page={props.page}
        swapPage={props.swapPage}
        setParams={props.setParams}
        params={props.params}
        currentPage={props.page}
        setLastPage={props.setLastPage}
        lastPage={props.lastPage}
      />
      {typeof window !== "undefined" &&
      windowScroll > 1050 &&
      array.length > 0 ? (
        <div
          onClick={() =>
            typeof window !== "undefined"
              ? window.scrollTo({ top: 0, behavior: "smooth" })
              : null
          }
          className="fixed z-[999] cursor-pointer top-4 p-3 w-fit h-10  xl:top-24 border border-slate-200 shadow hover:font-bold  translate-x-0 inset-x-0  mx-auto flex hero gap-2 text-white    rounded-full bg-[#43b1f1]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z"
              clipRule="evenodd"
            />
          </svg>
          Scroll to top
        </div>
      ) : null}
      <div
        className="flex   xl:mx-24     text-md   
         relative 
         xl:w-[35vw]
         md:w-[80vw] flex-col xl:border xl:border-[#f9f9f9]   lg:w-[50vw]  "
      >
        <div className="flex p-3 hero sticky top-0 mb-2 z-[9999] bg-white justify-between">
          <div className="hover:border-slate-200 hover:bg-white btn-ghost btn btn-circle btn-sm bg-white">
            <svg
              onClick={() => {
                props.setLastPage(props.page);
                props.swapPage("home");
              }}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="xl:w-6 xl:h-6 w-5 h-5 cursor-pointer
           
              
             "
            >
              <path
                fill-rule="evenodd"
                d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </div>
          <p className="text-1xl ">@{user?.username}</p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
          </svg>
        </div>
        <div className="relative h-44 flex  mt-2 flex-col gap-4">
          {banner !== "" ? (
            <img
              src={api.cdn.url({ id: user.id, file: banner, collection: "users" })}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300"></div>
          )}
          <div className="flex justify-between relative w-full">
            <div className="indicator w-24  ">
              {online ? (
                <span className="indicator-item absolute mt-[2vh] right-0 bg-green-500 badge"></span>
              ) : (
                <span className="indicator-item absolute mt-[2vh] right-0 bg-[#4a4a4a] badge"></span>
              )}
              {user.avatar ? (
                <img
                  src={api.cdn.url({
                    id: user.id,
                    file: user.avatar,
                    collection: "users",
                  })}
                  alt={user.username}
                  className=" w-24  h-24     rounded object-cover avatar  absolute bottom-[-3vh] left-2   border-2 border-double shadow   border-white"
                ></img>
              ) : (
                <div className="avatar placeholder">
                  <div className="bg-base-200 text-black rounded w-24  h-24   avatar  absolute bottom-[-3vh] left-2   border-2   shadow   border-white">
                    <span className="text-2xl">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute right-2 flex gap-5 ">
              {props.params.user.id !== api.authStore.model().id ? (
                <>
                  <button className="   btn-outline border-slate-200   ">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-7 h-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                ""
              )}
              <button
                onClick={() => {
                  user.id === api.authStore.model().id
                    ? (document
                        ?.getElementById("edit-modal")
                        // @ts-ignore
                        ?.showModal() as HTMLDialogElement)
                    : follow();
                }}
                className="btn  text-white hover:bg-black  btn-sm rounded-full bg-black"
              >
                {user.id === api.authStore.model().id
                  ? "Edit Profile"
                  : followers.includes(api.authStore.model().id)
                  ? "Unfollow"
                  : "Follow"}
              </button>
            </div>
          </div>
        </div>

        <div className="justify-between mt-[8vh] mx-4">
          <div className="flex w-full  hero gap-3">
            <p className="text-2xl font-bold">{user.username}</p>

            {user.validVerified ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 fill-blue-500 text-white h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                />
              </svg>
            ) : (
              ""
            )}

            {user.isDeveloper ? (
              <div
                className="tooltip    rounded tooltip-left"
                data-tip="Postr Developer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5   h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
                  />
                </svg>
              </div>
            ) : (
              ""
            )}

            {user.postr_plus ? (
              <div
                className="tooltip z[-1]"
                data-tip={`Subscriber since ${new Date(
                  user.plus_subscriber_since
                ).toLocaleDateString()}`}
              >
                <span className="badge badge-outline badge-md text-sm border-blue-500 z-[-1] text-sky-500">
                  Postr+ Subscriber
                </span>
              </div>
            ) : (
              ""
            )}
          </div>
          <p className="opacity-45">@{user.username}</p>
          <p className="mt-6">
            {user.bio !== "" ? user.bio : "This user has not set a bio."}
          </p>
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-2 sm:text-sm mb-5">
            <p className="hero flex mt-4 gap-2 w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                />
              </svg>
              Joined {new Date(props.params.user.created).toLocaleDateString()}
            </p>
            {user.location !== "" ? (
              <p className="mt-4 hero flex gap-2">
                <Icon />{" "}
                <span className="text-md capitalize font-medium">
                  {user.location}
                </span>
              </p>
            ) : (
              ""
            )}

            {user.social !== "" ? (
              <p className="mt-4 hero flex gap-2 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>

                <span className="text-md cursor-pointer font-medium">
                  <span
                    onClick={() => {
                      window.open(user.social);
                    }}
                    className="text-blue-500 text-md w-5/6  hover:underline"
                  >
                    {user.social}
                  </span>
                </span>
              </p>
            ) : (
              ""
            )}
          </div>
          <div className="flex gap-2">
            <p className=" mt-2 text-md">
              <span className="font-bold">
                {" "}
                {followers !== undefined ? followers.length : 0}{" "}
              </span>
              {followers !== undefined && followers.length === 1
                ? "Follower"
                : "Followers"}
            </p>
            <p className=" mt-2 text-md">
              <span className="font-bold">
                {" "}
                {user.following ? user.following.length : 0}{" "}
              </span>
              Following
            </p>
          </div>
        </div>
        {user.expand?.followers &&
        user.id !== api.authStore.model().id &&
        user.expand?.followers.length > 0 ? (
          <div className="avatar-group mx-3 -space-x-6 flex gap-8 text-sm hero rtl:space-x-reverse">
            {user.expand.followers.map((e: any) => {
              if (api.authStore.model().following.includes(e.id)) {
                return (
                  <>
                    <div className="avatar rounded mt-2">
                      <div className="w-4">
                        <img
                          src={api.cdn.url({
                            id: e.id,
                            collection: "users",
                            file: e.avatar,
                          })}
                          alt=""
                          className="rounded w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <p className="mt-2 opacity-70 hover:underline cursor-pointer">
                      Followed By{" "}
                      {user.expand.followers.map((e: any) => {
                        if (api.authStore.model().following.includes(e.id)) {
                          return <span>{e.username}</span>;
                        }
                      })}
                    </p>
                  </>
                );
              }
            })}
          </div>
        ) : (
          ""
        )}
        <div className="flex flex-row p-2 gap-2 justify-between    xl:border-[#f9f9f9] ">
          <a
            role="tab"
            onClick={() => {
              feedPage !== "posts" ? swapPage("posts") : "";
            }}
            className={`
           p-2  cursor-pointer  ${
             feedPage === "posts" ? "active font-bold   " : ""
           }
        `}
          >
            Posts
            {feedPage === "posts" ? (
              <div className=" rounded-md h-2 bg-blue-500"></div>
            ) : (
              ""
            )}
          </a>

          <a
            onClick={() => {
              feedPage !== "replies" ? swapPage("collections") : "";
            }}
            role="tab"
            className={`  cursor-pointer  p-2  ${
              feedPage === "replies" ? "active  " : ""
            }`}
          >
            Collections
            {feedPage === "collections" ? (
              <div className=" rounded-md h-2 bg-blue-500"></div>
            ) : (
              ""
            )}
          </a>
          <a
            onClick={() => {
              feedPage !== "media" ? swapPage("media") : "";
            }}
            role="tab"
            className={`
           p-2  cursor-pointer ${
             feedPage === "media" ? "active font-bold  " : ""
           }
        `}
          >
            Media
            {feedPage === "media" ? (
              <div className=" rounded-md h-2 bg-blue-500"></div>
            ) : (
              ""
            )}
          </a>
          <a
            onClick={() => {
              feedPage !== "likes" ? swapPage("likes") : "";
            }}
            role="tab"
            className={`
         p-2  cursor-pointer ${feedPage === "likes" ? "active font-bold" : ""}
        `}
          >
            Likes
            {feedPage === "likes" ? (
              <div className=" rounded-md h-2 bg-blue-500"></div>
            ) : (
              ""
            )}
          </a>
        </div>

        <InfiniteScroll
          hasMore={hasMore}
          dataLength={array.length}
          next={loadMore}
          loader={""}
        >
          {
            <div
              className={
                feedPage === "media" && !isFetching
                  ? "grid grid-cols-3 gap-3   mb-24 xl:p-3 lg:p-3 md:p-3  sm:p-3 p-2"
                  : `flex flex-col  xl:p-0 lg:p-0 md:p-0 p-4 mb-24 
                  ${
                    array.length > 0  ? "  xl:border xl:border-[#f9f9f9] " : ""
                  }
                  ${
                      array.length < 2 ? "border-b-0 border-b-transparent" : ""
                    }`
              }
            >
              {isFetching ? (
                <div className="mx-auto W-full flex justify-center">
                  <span className="loading loading-spinner-large loading-spinner mt-5 text-blue-600"></span>
                </div>
              ) : feedPage === "posts" || feedPage === "likes" ? (
                array.length > 0 ? (
                  array.map((e: any, index: number) => {
                    return (
                      <div
                        className={
                          index === array.length - 1 ? "sm:mt-3" : "mb-6"
                        }
                        
                      >
                        <Post
                          cache={
                            api.cacehStore.get(
                              `user-feed-posts-${page}-${user.id}`
                            )
                              ? JSON.parse(
                                  api.cacehStore.get(
                                    `user-feed-posts-${page}-${user.id}`
                                  )
                                )
                              : null
                          }
                          {...e}
                          cacheKey={`user-feed-posts-${page}-${user.id}`}
                          swapPage={props.swapPage}
                          setParams={props.setParams}
                          params={props.params}
                          page={props.page}
                          setArray={setArray}
                          array={array}
                           
                          pin={(id: string)=>{ 
                            let post = array.find((e: any) => e.id === id);
                            if(post.pinned) {
                              post.pinned = false;
                              let arr = [...array];
                              arr[index] = post;
                              // move back to original position by date
                              arr = arr.sort((a: any, b: any) => {
                                return new Date(b.created).getTime() - new Date(a.created).getTime();
                              });

                              for(var i in arr){
                                if(arr[i].pinned){
                                  //@ts-ignore
                                  arr.unshift(arr.splice(i, 1)[0]);
                                  // sort pinned by date
                                  //@ts-ignore
                                  arr = arr.sort((a: any, b: any) => {
                                  if(a.pinned && b.pinned) return new Date(b.created).getTime() - new Date(a.created).getTime();
                                  });
                                }
                              }
                              
                              api.update({ collection: "posts", id: id, record: { pinned: false }, cacheKey: `user-feed-posts-${page}-${user.id}` });
                              setArray(arr);
                              return;
                            }
                            post.pinned = true;
                            let arr = [...array];
                            arr[index] = post;
                            // move to top of array
                            arr.unshift(arr.splice(index, 1)[0]);
                            api.update({ collection: "posts", id: id, record: { pinned: true }, cacheKey: `user-feed-posts-${page}-${user.id}` });
                            setArray(arr);
                            
                          }}
                          currentPage={page}
                          updateCache={(key: string, value: any) => {
                            let cache = JSON.parse(
                              api.cacehStore.get(
                                `user-feed-${feedPage}-${page}-${user.id}`
                              )
                            );

                            if(cache && cache.value.items){
                              cache.value.items.forEach(
                                (e: any, index: number) => {
                                  if (e.id === key) {
                                    cache.value.items[index] = value;
                                  }
                                }
                              );
                              for (var i in api.cacehStore.keys()) {
                                let k = api.cacehStore.keys()[i];
                                if (k.includes("home-posts")) {
                                  let cache = JSON.parse(api.cacehStore.get(k));
                                  cache.value.items.forEach(
                                    (e: any, index: number) => {
                                      if (e.id === key) {
                                        cache.value.items[index] = value;
                                      }
                                    }
                                  );
                                  api.cacehStore.set(k, cache.value, 230);
                                }
                              }
  
                              api.cacehStore.set(
                                `user-feed-${feedPage}-${page}-${user.id}`,
                                cache.value,
                               1200
                              );
                            }
                          }}
                        ></Post>
                      </div>
                    );
                  })
                ) : (
                  <div>
                    <p className="text-center text-xl font-bold mt-10">
                      {user.id === api.authStore.model().id
                        ? "You"
                        : user.username}
                      {` haven't posted anything yet.`}
                    </p>
                  </div>
                )
              ) : feedPage === "collections" ? (
                array.length > 0 ? (
                  <div className="mt-5">
                    Coming Soon
                  </div>
                ) : array.length === 0 ? (
                  <div className="text-center text-lg mt-10">
                    <p className="font-extrabold ">
                      {api.authStore.model().id === user.id
                        ? "You haven't replied to anything yet."
                        : `@${user.username} hasn't replied to anyone yet`}
                    </p>
                  </div>
                ) : (
                  ""
                )
              ) : feedPage === "media" ? (
                array.length > 0 ? (
                  array.map((e: any) => {
                    return (
                      <>
                        {e.file.map((f: any) => {
                          let id = f.replace(/\./g, "");
                          return (
                            <>
                              {" "}
                              <LazyImage
                                onClick={() => {
                                  //@ts-ignore
                                  document
                                    .getElementById(id)
                                    //@ts-ignore
                                    ?.showModal();
                                }}
                                src={api.cdn.url({
                                  id: e.id,
                                  collection: "posts",
                                  file: f,
                                })}
                                height="100%"
                                width="100%"
                                alt=""
                                className="w-full cursor-pointer   rounded-md h-44 object-cover"
                              ></LazyImage>
                              <Modal id={id } height="h-[100vh]">
                                <div className="flex flex-col justify-center items-center h-full bg-[#121212]  relative">
                                  <svg
                                    onClick={() => {
                                      //@ts-ignore
                                      document
                                        .getElementById(id)
                                        //@ts-ignore
                                        ?.close();
                                    }}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-6 h-6 cursor-pointer text-white absolute left-2 top-2"
                                  >
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                  </svg>

                                  <img
                                    src={api.cdn.url({
                                      id: e.id,
                                      collection: "posts",
                                      file: f,
                                    })}
                                    alt={f}
                                    className=" w-full   object-contain mt-2 cursor-pointer"
                                  ></img>
                                </div>
                              </Modal>
                            </>
                          );
                        })}
                      </>
                    );
                  })
                ) : (
                  Array.from(Array(10).keys()).map((e: any) => {
                    return (
                      <LazyImage
                        src={""}
                        height="100%"
                        width="100%"
                        alt=""
                        className="w-full   rounded-md h-44 object-cover"
                      />
                    );
                  })
                )
              ) : (
                ""
              )}
            </div>
          }
        </InfiniteScroll>

        <Modal
          id="edit-modal"
          height="xl:h-[75vh] xl:rounded-box xl:max-w-[75vw] h-screen"
        >
          <div className="mx-2 mt-3    p-0">
            <div className="flex hero justify-between">
              <svg
                onClick={() => {
                  //@ts-ignore
                  document?.getElementById("edit-modal").close();
                }}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 cursor-pointer
             
              
             "
              >
                <path
                  fill-rule="evenodd"
                  d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
                  clip-rule="evenodd"
                ></path>
              </svg>

              <p className="text-1xl mx-8 mr-0">Edit Profile</p>
              {
                saving ? <span className="loading  loading-sm loading-spinner  text-blue-600"></span> :  <button
                className="btn btn-sm rounded-full bg-black text-white "
                onClick={() => {
                  console.log("saving");
                  save();
                }}
              >
                Save
              </button>
              }
            </div>
          </div>
          <input
            type="file"
            className="hidden"
            id="change-avatar"
            name="change-avatar"
            accept="image/*"
            onChange={(e) => {
              console.log(e.target.files);
              if (e.target.files) {
                let file = e.target.files[0];
                setAvatar(file);
                if (file) {
                  let reader = new FileReader();

                  reader.onload = (e) => {
                    avatarRef.current.src = e.target?.result;
                  };
                  reader.readAsDataURL(file);
                }
              }
            }}
          />
          <input
            type="file"
            className="hidden"
            id="change-banner"
            name="change-banner"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) {
                let file = e.target.files[0];
                setBannerBlob(new Blob([file], { type: file.type }));
                setBannerFile(file);

                let reader = new FileReader();
                reader.onload = (e) => {
                  //@ts-ignore
                  bannerRef.current.src = e.target?.result;
                };
                reader.readAsDataURL(file);
              }
              // @ts-ignore
            }}
          />
          <div className="flex flex-col croll   relative mt-4">
            <div className="relative h-24 mb-6   flex flex-col w-full gap-2">
              {user.banner !== "" || bannerBlob !== null ? (
                <div className="relative h-[9rem]">
                  <img
                    src={
                      bannerBlob !== null
                        ? URL.createObjectURL(bannerBlob)
                        :  api.cdn.url({ id: user.id, file: user.banner, collection: "users" })
                    }
                    ref={bannerRef}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute btn btn-circle bg-[#030303] bg-opacity-25  inset-x-0 mx-auto translate-x-0  
           left-[-2vw]
          text-white
          top-[30%]"
                  >
                    <label
                      htmlFor="change-banner"
                      onClick={() => {
                        //@ts-ignore
                        document.getElementById("change-banner").click();
                      }}
                    >
                      <button>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6  "
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                          />
                        </svg>
                      </button>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="relative h-32">
                  <div className="w-full h-36 object-cover bg-gray-300 "></div>
                  <div
                    className="absolute btn btn-circle bg-[#030303] bg-opacity-25  inset-x-0 mx-auto translate-x-0  
           left-[-2vw]
          text-white
          top-[30%]"
                  >
                    <label
                      htmlFor="change-banner"
                      onClick={() => {
                        //@ts-ignore
                        document.getElementById("change-banner").click();
                      }}
                    >
                      <button>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6  "
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                          />
                        </svg>
                      </button>
                    </label>
                  </div>
                </div>
              )}
              {props.params.user.avatar !== "" || avatar !== null ? (
                <div className="absolute top-[80px] left-2">
                  <div className="relative w-32  ">
                    <img
                      src={
                        avatar ||
                        api.cdn.url({
                          id: user.id,
                          collection: "users",
                          file: user.avatar,
                        })
                      }
                      ref={avatarRef}
                      alt=""
                      className="w-20 h-20 object-cover avatar rounded  border-slate-200 border-2"
                    />

                    <label
                      htmlFor="change-avatar"
                      onClick={() => {
                        //@ts-ignore
                        document.getElementById("change-avatar").click();
                      }}
                    >
                      <div className="text-white absolute btn btn-circle btn-sm bg-[#030303] bg-opacity-25 left-[25px] top-[26px] inset-x-0   translate-x-0">
                        <button>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6  "
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                            />
                          </svg>
                        </button>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="absolute top-[80px] left-5">
                  <div className="relative w-32  ">
                    <div className="w-20 h-20 object-cover bg-gray-300 avatar rounded border-slate-200 border-2"></div>

                    <label
                      htmlFor="change-avatar"
                      onClick={() => {
                        //@ts-ignore
                        document.getElementById("change-avatar").click();
                      }}
                    >
                      <div className="text-white absolute btn btn-circle btn-sm bg-[#030303] bg-opacity-50 left-[25px] top-[26px] inset-x-0   translate-x-0">
                        <button>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6  "
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                            />
                          </svg>
                        </button>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-12  p-3 sm:scroll ">
              <div className="relativ  flex flex-col gap-3  ">
                <div>
                  <label>Username</label>
                  <textarea
                    className="w-full h-12 p-2  mt-2 resize-none outline-none bg-transparent textarea   border-slate-200"
                    placeholder="Bio"
                    value={user.username}
                    defaultValue={props.params.user.username}
                    onChange={(e) => {
                      if (e.target.value.length >= 15) {
                        setUser({
                          ...user,
                          username: e.target.value.slice(0, 15),
                        });
                        return;
                      }
                      setUser({ ...user, username: e.target.value });
                    }}
                  ></textarea>
                </div>
                <div className="relative">
                  <label>Bio</label>
                  <textarea
                    className="w-full h-20 p-2 mt-2 resize-none outline-none bg-transparent textarea   border-slate-200"
                    placeholder="Bio"
                    value={user.bio}
                    onChange={(e) => {
                      if (e.target.value.length >= maxBioLength) {
                        setUser({
                          ...user,
                          bio: e.target.value.slice(0, maxBioLength),
                        });
                        return;
                      }
                      setUser({ ...user, bio: e.target.value });
                    }}
                    defaultValue={props.params.user.bio}
                  ></textarea>
                  <p className="absolute bottom-4 right-4 text-xs opacity-50">
                    {user.bio.length}/{maxBioLength}
                  </p>
                </div>
                <div className="relative">
                  <label>Location</label>
                  <textarea
                    className="w-full h-12 p-2 mt-2 resize-none outline-none bg-transparent textarea   border-slate-200"
                    placeholder="Location"
                    value={user.location}
                    onChange={(e) => {
                      if (e.target.value.length >= 30) {
                        setUser({
                          ...user,
                          location: e.target.value.slice(0, 30),
                        });
                        return;
                      }
                      setUser({ ...user, location: e.target.value });
                    }}
                    defaultValue={props.params.user.location}
                  ></textarea>
                  <p className="absolute bottom-4 right-4 text-xs opacity-50">
                    {user.location.length}/30
                  </p>
                </div>
                <div className="relative">
                  <label>
                    Social{" "}
                    <span className="text-sm opacity-50">
                      (Strafe, Twitter, Instagram, Website.)
                    </span>
                  </label>
                  <textarea
                    className="w-full h-12 p-2 mt-2 resize-none outline-none bg-transparent textarea   border-slate-200"
                    placeholder="Social"
                    value={user.social}
                    onChange={(e) => {
                      if (e.target.value.length >= 30) {
                        setUser({
                          ...user,
                          social: e.target.value.slice(0, 30),
                        });
                        return;
                      }
                      setUser({ ...user, social: e.target.value });
                    }}
                    defaultValue={props.params.user.social}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
      <SideBarRight></SideBarRight>
      <div className="xl:hidden lg:hidden md:hidden">
        <BottomNav swapPage={props.swapPage} />
      </div>
    </div>
  );
}
