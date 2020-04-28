import { PluginRT } from './';
import path from 'path';

const rt = new PluginRT({
  installDir: path.join(__dirname, './plugins/')
});

(async function() {
  console.log(rt);
  // const pkg = await rt.fetch('@pipcook/plugins-csv-data-access');
  // await rt.install(pkg);

  rt.run('@pipcook/plugins-csv-data-access');
  
})();


