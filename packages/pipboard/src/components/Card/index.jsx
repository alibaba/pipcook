import React from 'react';
import './index.scss';

const onClickItem = (url) => {
  location.href = url;
};

export default function({ items }) {
  return (
      <div className="card-wrapper">
        {items.map((item) => {
          return (
            <div
              className="card-item"
              onClick={() => {
                onClickItem(item.url);
              }}
            >
              <img
                className="card-img"
                src={item.cover}
                alt=""
              />
              <h5 className="card-title">{item.title}</h5>
              <p className="card-desc">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
  );  
}