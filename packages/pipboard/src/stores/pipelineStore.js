import { observable, action } from "mobx";

class AllData {
  @observable fuck = {
    a: 1
  };

  @action mainAjax(isActivity) {

  }
}

export default new AllData();
