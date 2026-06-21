import React, { useEffect, useRef } from 'react';
import { createApp, h, reactive } from 'vue';

/**
 * VueWrapper bridges React and Vue.
 * It mounts a Vue 3 component inside a React component,
 * and uses Vue's reactivity system to forward updated props.
 *
 * @param {Object} props
 * @param {Object} props.component - The Vue component (e.g. imported from .vue)
 * @param {Object} props.props - The props object to pass to the Vue component
 */
export default function VueWrapper({ component: VueComponent, props = {} }) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const reactivePropsRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !VueComponent) return;

    // Create a reactive props object for Vue
    const reactiveProps = reactive({ ...props });
    reactivePropsRef.current = reactiveProps;

    // Create and mount the Vue application instance
    const app = createApp({
      render() {
        return h(VueComponent, reactiveProps);
      },
    });

    app.mount(containerRef.current);
    appRef.current = app;

    return () => {
      if (appRef.current) {
        appRef.current.unmount();
        appRef.current = null;
      }
      reactivePropsRef.current = null;
    };
  }, [VueComponent]);

  // Update reactive props whenever React props change
  useEffect(() => {
    if (reactivePropsRef.current) {
      // Copy new/updated props
      Object.assign(reactivePropsRef.current, props);
      // Remove any props that are no longer present in the incoming props
      for (const key in reactivePropsRef.current) {
        if (!(key in props)) {
          delete reactivePropsRef.current[key];
        }
      }
    }
  }, [props]);

  return <div ref={containerRef} className="vue-component-wrapper" />;
}
