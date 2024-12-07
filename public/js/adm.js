// Abstract DOM Manipulator
// Can't use a web framework? We BUILD a web framework

/*
ADM works on the concept of HTML 'buckets', where we can slot
components into. Components can be a JS function to build the UI,
or a DOM element.

Buckets have to be FULLY managed by ABM.
There is NO safety rails, everything assumes everything will just work.

There is limited state tracking of objects, so a lot of 'nice to haves'
that other (proper) frameworks have, we don't have. lol.

Yay :)
*/

// DOM building utils

// SVG elements need to be created the SVG 'namespace', so we have
// a switch down below that uses document.createElementNS instead
const svgElements = ["svg", "path"];

// Creates element
function h(tag, children = []) {
  const [tagName, tagAttrs, tagEvents] =
    typeof tag === "string"
      ? [tag, {}, {}]
      : [tag.name, tag.attrs ?? {}, tag.events ?? {}];

  const item = svgElements.includes(tagName)
    ? document.createElementNS("http://www.w3.org/2000/svg", tagName)
    : document.createElement(tagName);
  for (const [k, v] of Object.entries(tagAttrs)) {
    item.setAttribute(k, v);
  }
  for (const [k, v] of Object.entries(tagEvents)) {
    item.addEventListener(k, v);
  }

  // If children isn't an array, wrap it in one
  children ??= [];
  if (!(typeof children === "object" && Array.isArray(children))) {
    children = [children];
  }
  for (let child of children) {
    if (typeof child === "function") {
      child = child(h);
    }
    switch (typeof child) {
      case "string":
        item.innerHTML = child;
        break;
      case "object":
        if (child instanceof ADMComponentWrapper) {
          child = window.adm._buildUI(child.componentID);
        }

        item.appendChild(child);
        break;
      default:
        const stringItem = child["toString"]
          ? child.toString()
          : `Unknown type: ${typeof child}`;
        item.innerHTML = stringItem;
        break;
    }
  }
  return item;
}

// Creates bucket with default component
function b(component) {
  const element = h("div");
  const bucket = window.adm.bucket(element);
  bucket.mount(component);
  return element;
}

class ADMBucketWrapper {
  bucketId;

  constructor(bucketId) {
    this.bucketId = bucketId;
  }

  mount(...options) {
    window.adm.mount(this.bucketId, ...options);
  }

  unmount(...options) {
    window.adm.unmount(this.bucketId, ...options);
  }

  rebuild(...options) {
    window.adm.rebuild(this, ...options);
  }
}

class ADMComponentWrapper {
  componentID;

  constructor(componentID) {
    this.componentID = componentID;
  }

  mount(bucketId, ...options) {
    window.adm.mount(bucketId, this.componentID, ...options);
  }

  rebuild(...options) {
    window.adm.rebuild(this, ...options);
  }
}

class ADM {
  buckets = {};
  components = {};
  bucketComponentMetadata = {};

  bucket(element) {
    const id = Math.floor(Math.random() * 100000).toString();
    this.buckets[id] = element;
    return new ADMBucketWrapper(id);
  }

  component(component) {
    const id = Math.floor(Math.random() * 100000).toString();
    this.components[id] = component;
    return new ADMComponentWrapper(id);
  }

  mount(bucketWrapper, componentWrapper) {
    const bucketID = this._unwrapBucketWrapper(bucketWrapper);
    const componentID = this._unwrapComponentWrapper(componentWrapper);

    this.unmount(bucketID);

    const bucket = this.buckets[bucketID];
    const component = this._buildUI(componentID);
    bucket.appendChild(component);

    this.bucketComponentMetadata[bucketID] = componentID;
  }

  unmount(bucketWrapper) {
    const bucketID = this._unwrapBucketWrapper(bucketWrapper);

    const bucket = this.buckets[bucketID];
    bucket.innerHTML = ""; // Delete all children

    delete this.bucketComponentMetadata[bucketID];
  }

  rebuild(wrapper) {
    // TODO: make this check for either the class or the serialized version of the class more concise and less repetitive
    if (
      wrapper instanceof ADMBucketWrapper ||
      wrapper.bucketId != undefined ||
      typeof wrapper === "string"
    ) {
      const bucketID = this._unwrapBucketWrapper(wrapper);
      const currentComponentID = this.bucketComponentMetadata[bucketID];
      if (!currentComponentID) return false;
      this.mount(wrapper, currentComponentID);
      return true;
    }

    if (
      wrapper instanceof ADMComponentWrapper ||
      wrapper.componentID != undefined
    ) {
      const componentID = this._unwrapComponentWrapper(wrapper);
      const buckets = Object.entries(this.bucketComponentMetadata).filter(
        (e) => e[1] === componentID
      );
      for (const [bucket, _] of buckets) {
        this.rebuild(bucket);
      }
      return buckets.length > 0;
    }

    return false;
  }

  _unwrapBucketWrapper(bucket) {
    if (bucket instanceof ADMBucketWrapper || bucket.bucketId != undefined) {
      return bucket.bucketId;
    }
    return bucket;
  }

  _unwrapComponentWrapper(component) {
    if (
      component instanceof ADMComponentWrapper ||
      component.componentID != undefined
    ) {
      return component.componentID;
    }
    return component;
  }

  _buildUI(componentID) {
    const component = this.components[componentID];
    if (!component) return undefined;

    // We're a DOM objet, just return
    if (typeof component === "object") {
      return component;
    }

    // We're a constructor
    if (typeof component === "function") {
      const builtComponent = component(h, b);
      if (builtComponent === undefined) return undefined;
      if (typeof builtComponent !== "object")
        throw new Error("Builder returned unexpected value");
      return builtComponent;
    }

    throw new Error("Invalid component type");
  }
}

window.adm = new ADM();
