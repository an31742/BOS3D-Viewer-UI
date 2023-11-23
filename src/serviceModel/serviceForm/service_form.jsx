import React from "react";
import PropTypes from "prop-types";
import _ from "lodash-es";
// import { Form, Input } from 'antd';
import { Form, Input } from 'antd';
// import style from "./service_form.less";

class Table extends React.Component {
  constructor(props) {
    super(props);
    const expand = {};
    _.keys(props.data).forEach(k => {
      if (typeof props.data[k] === 'object') {
        expand[k] = true;
      }
    });
    this.state = {
      expand,
    };
  }

  toggleExpand(e, key) {
    e.preventDefault();
    e.stopPropagation();
    this.setState(state => ({
      expand: {
        ...state.expand,
        [key]: !state.expand[key],
      },
    }));
  }

  render() {
    const { data, indent } = this.props;
    const content = [];

    _.keys(data).forEach(k => {
      if (typeof data[k] !== 'object') {
        content.push(

          <Form
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            autoComplete="off"
          >
            <Form.Item
              label={k}
              name={k}
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input value={data[k]} />
            </Form.Item>

          </Form>

        );
      } else {
        content.push(
          <div
            key={k}
          >
            <div
              role="tree"
              tabIndex={0}
              onClick={e => { this.toggleExpand(e, k) }}
            >
              {k}
            </div>
            <div
              style={{ display: this.state.expand[k] ? 'block' : 'none' }}
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
