let globalToken;
let currentTracks = [];

const mainBucketElement = document.getElementById("adm-main-content");
const mainContentBucket = window.adm.bucket(mainBucketElement);

const icon = window.adm.component((h) =>
  h(
    {
      name: "svg",
      attrs: {
        viewBox: "0 0 24 24",
        class: "w-full h-full",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
      },
    },
    [
      h({
        name: "path",
        attrs: {
          d: "M12 18C12 20.2091 10.2091 22 8 22C5.79086 22 4 20.2091 4 18C4 15.7909 5.79086 14 8 14C10.2091 14 12 15.7909 12 18Z",
          stroke: "#1C274C",
          ["stroke-width"]: "1.5",
        },
      }),
      h({
        name: "path",
        attrs: {
          opacity: "0.5",
          d: "M12 18V8",
          stroke: "#1C274C",
          ["stroke-width"]: "1.5",
        },
      }),
      h({
        name: "path",
        attrs: {
          d: "M16.1167 3.94199L13.4833 5.25871C13.1184 5.44117 12.9359 5.5324 12.7852 5.64761C12.3949 5.94608 12.128 6.3778 12.0357 6.86043C12 7.04673 12 7.25073 12 7.65871C12 8.6298 12 9.11535 12.1196 9.44543C12.4356 10.3178 13.3101 10.8583 14.2317 10.7508C14.5804 10.7101 15.0147 10.493 15.8833 10.0587L18.5167 8.74199C18.8816 8.55954 19.0641 8.46831 19.2148 8.35309C19.6051 8.05463 19.872 7.62291 19.9643 7.14028C20 6.95397 20 6.74998 20 6.34199C20 5.3709 20 4.88536 19.8804 4.55528C19.5644 3.68288 18.6899 3.14239 17.7683 3.24989C17.4196 3.29057 16.9853 3.50771 16.1167 3.94199Z",
          stroke: "#1C274C",
          ["stroke-width"]: "1.5",
          ["stroke-linecap"]: "round",
        },
      }),
    ]
  )
);

/*
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
</svg>

*/

const checkIcon = window.adm.component((h) =>
  h(
    {
      name: "svg",
      attrs: {
        fill: "none",
        viewBox: "0 0 24 24",
        ["stroke-width"]: "1.5",
        stroke: "currentColor",
        class: "w-5 h-5",
      },
    },
    h({
      name: "path",
      attrs: {
        ["stroke-linecap"]: "round",
        ["stroke-linejoin"]: "round",
        d: "m4.5 12.75 6 6 9-13.5",
      },
    })
  )
);

/*
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
  */

const crossIcon = window.adm.component((h) =>
  h(
    {
      name: "svg",
      attrs: {
        fill: "none",
        viewBox: "0 0 24 24",
        ["stroke-width"]: "1.5",
        stroke: "currentColor",
        class: "w-5 h-5",
      },
    },
    h({
      name: "path",
      attrs: {
        ["stroke-linecap"]: "round",
        ["stroke-linejoin"]: "round",
        d: "M6 18 18 6M6 6l12 12",
      },
    })
  )
);

const trackList = window.adm.component((h) =>
  currentTracks.length > 0
    ? h(
        {
          name: "div",
          attrs: {
            class:
              "bg-white rounded-lg inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8",
          },
        },
        h(
          {
            name: "table",
            attrs: { class: "divide-y divide-gray-300" },
          },
          [
            h(
              "thead",
              h("tr", [
                h(
                  {
                    name: "th",
                    attrs: {
                      class:
                        "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0",
                    },
                  },
                  "Track Name"
                ),
                h(
                  {
                    name: "th",
                    attrs: {
                      class:
                        "px-3 py-3.5 text-left text-sm font-semibold text-gray-900",
                    },
                  },
                  "Available Offline"
                ),
                h(
                  {
                    name: "th",
                    attrs: { class: "relative py-3.5 pl-3 pr-4 sm:pr-0" },
                  },
                  [
                    /* play button */
                  ]
                ),
              ])
            ),
            h({ name: "tbody", attrs: { class: "divide-y divide-gray-200" } }, [
              ...currentTracks.map((track, trackIdx) =>
                h("tr", [
                  h(
                    {
                      name: "td",
                      attrs: {
                        class:
                          "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0",
                      },
                    },
                    track.trackName
                  ),
                  h(
                    {
                      name: "td",
                      attrs: {
                        class:
                          "whitespace-nowrap px-3 py-4 text-sm text-blue-600",
                      },
                    },
                    track.offline ?? false ? checkIcon : crossIcon
                  ),
                  h(
                    {
                      name: "td",
                      attrs: {
                        class:
                          "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0",
                      },
                    },
                    h(
                      {
                        name: "button",
                        events: {
                            // TODO
                          click: () => {},
                        },
                        attrs: {
                          class: "text-blue-600 hover:text-blue-900",
                        },
                      },
                      "Play &rarr;"
                    )
                  ),
                ])
              ),
            ]),
          ]
        )
      )
    : h(
        {
          name: "p",
          attrs: {
            class:
              "py-1 sm:px-6 lg:px-8 bg-white rounded-lg text-gray-700 animate-pulse",
          },
        },
        "Loading tracks..."
      )
);

const appUi = window.adm.component((h, b) =>
  h(
    {
      name: "div",
      attrs: {
        class:
          "w-full h-screen flex flex-col items-center justify-center gap-y-8 py-4 px-2",
      },
    },
    [
      // App title
      h({ name: "div", attrs: { class: "text-center" } }, [
        h({ name: "div", attrs: { class: "inline-flex items-center" } }, [
          h({ name: "div", attrs: { class: "h-12 w-12" } }, icon),
          h(
            { name: "h1", attrs: { class: "text-4xl font-bold" } },
            "Spoti-OOF"
          ),
        ]),
        h(
          { name: "p", attrs: { class: "text-gray-500" } },
          "When Spotify takes a massive oof."
        ),
        /*
          h(
            { name: "button", events: { click: () => swUpdateApp() } },
            "Update Spoti-OOF"
          ),
          */
      ]),

      b(trackList),

      h(
        {
          name: "button",
          events: { click: () => loadTracks() },
          attrs: {
            class:
              "rounded-md bg-blue-50 px-2.5 py-1.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-100",
          },
        },
        "Refresh tracks"
      ),

      h(
        {
          name: "div",
          attrs: {
            class:
              "absolute -z-10 inset-0 flex items-center justify-center opacity-[10%]",
          },
        },
        icon
      ),
    ]
  )
);

mainContentBucket.mount(appUi);

async function loadTracks() {
  // Cache is handled by SW
  const tracks = await fetch(`/tracks`, { cache: "no-store" });
  currentTracks = await tracks.json();

  trackList.rebuild();
}

async function installSW() {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    if (registration.installing) {
      console.log("Service worker installing");
    } else if (registration.waiting) {
      console.log("Service worker installed");
    } else if (registration.active) {
      console.log("Service worker active");
    }
  } catch (error) {
    console.error(`Registration failed with ${error}`);
  }
}

installSW();
loadTracks();
