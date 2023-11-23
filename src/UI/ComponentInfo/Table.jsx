import React from "react";
import PropTypes from "prop-types";
import _ from "lodash-es";
import style from "./index.less";

class Table extends React.Component {
  static propTypes={
    data: Object,
    newData: Object
  }

  constructor(props) {
    super(props);
    const expand = {};
    const inputValues = {};
    const newInputValues = _.cloneDeep(props.newData);
    _.keys(props.data).forEach((k) => {
      inputValues[k] = props.data[k];
      // if (k === '基本信息' || k === '约束' || k === '阶段化' || k === '文字' || k === '尺寸标注' || k === '标识数据' || k === '其他') {
      //   if (Object.keys(inputValues).length !== 0) {
      //     newInputValues[k] = props.data[k];
      //     console.log("inputValues111", newInputValues);
      //   }
      // }

      if (typeof props.data[k] === "object") {
        expand[k] = true;
      }
    });

    this.state = {
      expand,
      inputValues,
      newInputValues // 使用深拷贝
    };
    // this.newInputValues = JSON.parse(JSON.stringify(inputValues)); // 深拷贝
    console.log("inputValues222", this.state.newInputValues);
  }

  toggleExpand(e, key) {
    e.preventDefault();
    e.stopPropagation();
    const value = e.target.value;
    this.setState(prevState => ({
      inputValues: {
        ...prevState.inputValues,
        [key]: value
      }
    }));
  }

  onChange(e, key) {
    e.preventDefault();
    e.stopPropagation();
    const value = e.target.value;
    this.setState(prevState => ({
      inputValues: {
        ...prevState.inputValues,
        [key]: value
      }
    }));
  }

  onBlur(e, key) {
    e.preventDefault();
    e.stopPropagation();
    console.log("key", key);
    console.log("e.target.value", e.target.value);
    console.log("this.state.newInputValues", this.state.newInputValues);
  }

  render() {
    const { data, indent } = this.props;
    const content = [];

    _.keys(data).forEach((k) => {
      if (typeof data[k] !== "object") {
        content.push(
          <div className={style.item} key={k}>
            <div className={style.lable} title={k}>
              {k}
            </div>
            <input
              className={style.value}
              defaultValue={data[k].toString()}
              onChange={(e) => this.onChange(e, k, data[k])}
              onBlur={(e) => this.onBlur(e, k)}
            />
          </div>
        );
      } else {
        content.push(
          <div key={k} className={style[`indent-level-${indent}`]}>
            <div
              className={`${style.title} ${
                this.state.expand[k] ? style.collapse : ""
              }`}
              role="tree"
              tabIndex={0}
              onClick={(e) => {
                this.toggleExpand(e, k);
              }}
            >
              {k}
            </div>
            <div
              className={`${style.expand}`}
              style={{ display: this.state.expand[k] ? "block" : "none" }}
            >
              <Table data={data[k]} indent={this.props.indent + 1} />
            </div>
          </div>
        );
      }
    });
    return content;
  }
}

Table.propTypes = {
  data: PropTypes.object.isRequired,
  indent: PropTypes.number,
};

Table.defaultProps = {
  indent: 0,
};

export default Table;
