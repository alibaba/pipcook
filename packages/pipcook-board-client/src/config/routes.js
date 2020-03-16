import BasicLayout from '@/layouts/BasicLayout';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import ImageClassification from '@/pages/ImageClassification';
import TextClassification from '@/pages/TextClassification';
import ObjectDetection from '@/pages/ObjectDetection';

const routerConfig = [
  {
    path: '/',
    component: BasicLayout,
    children: [
      {
        path: '/dashboard',
        component: Dashboard,
      },

      {
        path: '/',
        redirect: '/dashboard',
      },
      {
        path: '/image-classification',
        component: ImageClassification,
      },
      {
        path: 'text-classification',
        component: TextClassification,
      },
      {
        path: '/object-detection',
        component: ObjectDetection,
      },
      {
        component: NotFound,
      },
    ],
  },
];

export default routerConfig;
