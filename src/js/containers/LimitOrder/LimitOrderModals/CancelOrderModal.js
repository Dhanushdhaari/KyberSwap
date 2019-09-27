import React, { Component } from "react";
import { connect } from "react-redux";
import { getTranslate } from "react-localize-redux";
import { Modal } from "../../../components/CommonElement";
import * as limitOrderActions from "../../../actions/limitOrderActions";
import limitOrderServices from "../../../services/limit_order";
import { OrderTableInfo } from "../../../components/CommonElement";
import makeOrderInfo from "../../../utils/convert_object";

@connect((store, props) => {
  const translate = getTranslate(store.locale);
  const limitOrder = store.limitOrder;
  const global = store.global;
  const account = store.account.account;

  return { translate, limitOrder, global, account };
})
export default class CancelOrderModal extends Component {
  constructor() {
    super();
    this.state = {
      isConfirming: false,
      isFinish: false,
      err: ""
    }
  }

  async confirmCancel() {
    this.props.global.analytics.callTrack("trackClickConfirmCancelOrder", this.props.order ? this.props.order.id : null);
    this.setState({
      isConfirming: true,
      err: ""
    });
    if (this.props.order) {
      try {
        const results = await limitOrderServices.cancelOrder(
          this.props.order
        );
        if (results) {
          if (this.props.limitOrder.filterMode === "client") {
            this.props.dispatch(limitOrderActions.updateOpenOrderStatus());
          } else {
            this.props.dispatch(limitOrderActions.getOrdersByFilter({}));

            if (this.props.account) {
              this.props.dispatch(limitOrderActions.getPendingBalances(this.props.account.address));
            }
          }
          this.props.dispatch(limitOrderActions.getListFilter());

          this.setState({
            isConfirming: false,
            isFinish: true
          });
        }
      } catch (err) {
        console.log(err);
        this.setState({
          isConfirming: false,
          isFinish: false,
          err: err.toString()
        });
      }
    }
  }

  closeModal = () => {
    if (this.state.isConfirming) return;
    this.setState({
      isConfirming: false,
      isFinish: false
    });
    this.props.closeModal();
  }

  contentModal = () => {
    var base = this.props.limitOrder.sideTrade === "buy" ? this.props.limitOrder.destTokenSymbol : this.props.limitOrder.sourceTokenSymbol;
    return (
      <div className="limit-order-modal">
        <div className="limit-order-modal__body">
          <div className="limit-order-modal__title">
            {this.props.translate("modal.cancel_order", {sideTrade: this.props.limitOrder.sideTrade, symbol: base}) ||
            `Cancel ${sideTrade} ${base} Order`}
          </div>
          <div
            className="limit-order-modal__close"
            onClick={e => this.closeModal()}
          >
            <div className="limit-order-modal__close-wrapper" />
          </div>
          <div className="limit-order-modal__content">
            <div className="limit-order-modal__message">
              {this.props.translate(
                "limit_order.canceling_order_message" ||
                "You are canceling this order"
              )}
            </div>
              <OrderTableInfo
                listOrder={makeOrderInfo(this.props.limitOrder)}
                translate={this.props.translate}
              />
          </div>
        </div>

        {(!this.state.isFinish && !this.state.err) &&
        <div className="limit-order-modal__footer">
          <button
            className={`btn-cancel ${this.state.isConfirming ? "btn-disabled" : ""}`}
            onClick={this.closeModal}
          >
            {this.props.translate("modal.no") || "No"}
          </button>
          <button
            className={`btn-confirm ${this.state.isConfirming ? "btn-disabled" : ""}`}
            onClick={e => this.confirmCancel()}
          >
            {this.props.translate("modal.yes") || "Yes"}
          </button>
        </div>
        }

        {this.state.isFinish && (
          <div className="limit-order-modal__msg limit-order-modal__msg--success">
            <div className={"limit-order-modal__text"}>
              <div className={"limit-order-modal__text--success"}>
                <img src={require("../../../../assets/img/limit-order/checkmark_green.svg")}/>
                <span>{this.props.translate("modal.success") || "Success"}</span>
              </div>
              <div className={"limit-order-modal__button limit-order-modal__button--success"} onClick={this.closeModal}>
                {this.props.translate("done") || "Done"}
              </div>
            </div>
          </div>
        )}

        {this.state.err &&
        <div className="limit-order-modal__msg limit-order-modal__msg--failed">
          <div className={"limit-order-modal__text limit-order-modal__text--failed"}>
            <div className={"limit-order-modal__left-content"}>
              <img src={require("../../../../assets/img/limit-order/error.svg")}/>
              <div>
                <div>{this.props.translate("error_text") || "Error"}</div>
                <div>{this.state.err}</div>
              </div>
            </div>
            <div className={"limit-order-modal__button limit-order-modal__button--failed"} onClick={this.closeModal}>
              {this.props.translate("ok") || "OK"}
            </div>
          </div>
        </div>
        }
      </div>
    );
  };

  render() {
    return (
      <Modal
        className={{
          base: "reveal medium confirm-modal",
          afterOpen: "reveal medium confirm-modal confirm-modal__cancel-order"
        }}
        isOpen={this.props.isOpen}
        onRequestClose={this.closeModal}
        contentLabel="Cancel Order Modal"
        content={this.contentModal()}
        size="medium"
      />
    );
  }
}
